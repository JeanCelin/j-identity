import {
  createUser,
  findUserByEmail,
  findUserById,
} from "../repositories/user.repository.js";

import bcrypt from "bcrypt";

import { generateAccessToken } from "./token.service.js";

import {
  generateRefreshToken,
  generateSecureRandomToken,
  hashRefreshToken,
} from "./refresh-token.service.js";

import {
  createSession,
  findSessionByRefreshTokenHash,
  revokeSession,
  revokeSessionFamily,
} from "../repositories/session.repository.js";

import { prisma } from "../lib/prisma.js";
import { AppError } from "../errors/app-error.js";
import { Prisma } from "@prisma/client";

import { validateClientApplication } from "./client-application.service.js";

type RegisterData = {
  name: string;
  email: string;
  password: string;
  clientId: string;
  clientSecret: string;
};

export async function registerUser(data: RegisterData) {
  await validateClientApplication(data.clientId, data.clientSecret);

  const existingUser = await findUserByEmail(data.email);

  if (existingUser) {
    throw new AppError(
      "EMAIL_ALREADY_EXISTS",
      "Este email já está cadastrado",
      409,
    );
  }

  const passwordHash = await bcrypt.hash(data.password, 12);

  try {
    const user = await createUser({
      name: data.name,
      email: data.email,
      passwordHash,
    });

    const { passwordHash: _, ...safeUser } = user;

    return safeUser;
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      throw new AppError(
        "EMAIL_ALREADY_EXISTS",
        "Este email já está cadastrado",
        409,
      );
    }

    throw err;
  }
}

export async function loginUser(
  email: string,
  password: string,
  clientId: string,
  clientSecret: string,
) {
  const clientApplication = await validateClientApplication(
    clientId,
    clientSecret,
  );

  const user = await findUserByEmail(email);

  /*
   * Não diferenciamos:
   * - usuário inexistente
   * - senha incorreta
   * - usuário inativo
   *
   * Isso evita revelar informações sobre a existência
   * ou estado da conta.
   */
  if (!user) {
    throw new AppError("INVALID_CREDENTIALS", "Email ou senha inválidos", 401);
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);

  if (!passwordMatches) {
    throw new AppError("INVALID_CREDENTIALS", "Email ou senha inválidos", 401);
  }

  if (!user.isActive) {
    throw new AppError("INVALID_CREDENTIALS", "Email ou senha inválidos", 401);
  }

  const accessToken = generateAccessToken(user.id);

  const { refreshToken, refreshTokenHash } = generateRefreshToken();

  const refreshTokenExpiresAt = new Date();

  refreshTokenExpiresAt.setDate(refreshTokenExpiresAt.getDate() + 30);

  const familyId = generateSecureRandomToken();

  await createSession(
    user.id,
    clientApplication.id,
    refreshTokenHash,
    refreshTokenExpiresAt,
    familyId,
  );

  return {
    accessToken,
    refreshToken,
  };
}

export async function getUser(id: string) {
  const user = await findUserById(id);

  if (!user || !user.isActive) {
    throw new AppError("UNAUTHORIZED", "Não autorizado", 401);
  }

  return user;
}

export async function refreshAccessToken(
  refreshToken: string,
  clientId: string,
  clientSecret: string,
) {
  try {
    const clientApplication = await validateClientApplication(
      clientId,
      clientSecret,
    );

    const refreshTokenHash = hashRefreshToken(refreshToken);

    const session = await findSessionByRefreshTokenHash(
      refreshTokenHash,
    );

    if (!session) {
      throw new AppError(
        "INVALID_TOKEN",
        "Token inválido",
        401,
      );
    }

    /*
     * O Refresh Token pertence a uma aplicação específica.
     *
     * Uma aplicação não pode utilizar o Refresh Token
     * pertencente a outra aplicação.
     */
    if (
      session.clientApplicationId !== clientApplication.id
    ) {
      throw new AppError(
        "UNAUTHORIZED",
        "Falha de autenticação",
        401,
      );
    }

    /*
     * A sessão já foi revogada.
     *
     * Isso pode significar reutilização de um Refresh Token
     * antigo. Revogamos toda a família, mas não informamos
     * ao cliente o motivo exato.
     */
    if (session.revokedAt) {
      await revokeSessionFamily(session.familyId);

      throw new AppError(
        "UNAUTHORIZED",
        "Falha de autenticação",
        401,
      );
    }

    if (session.expiresAt <= new Date()) {
      throw new AppError(
        "SESSION_EXPIRED",
        "Sessão expirada",
        401,
      );
    }

    const user = await findUserById(session.userId);

    if (!user) {
      /*
       * Não precisamos expor USER_NOT_FOUND aqui.
       *
       * Uma sessão válida apontando para um usuário inexistente
       * representa um estado inconsistente da aplicação.
       */
      throw new AppError(
        "INTERNAL_SERVER_ERROR",
        "Erro interno do servidor",
        500,
      );
    }

    if (!user.isActive) {
      throw new AppError(
        "UNAUTHORIZED",
        "Falha de autenticação",
        401,
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      // Revoga a sessão atual.
      await revokeSession(session.id, tx);

      const accessToken = generateAccessToken(user.id);

      // Gera um novo Refresh Token.
      const {
        refreshToken: newRefreshToken,
        refreshTokenHash: newRefreshTokenHash,
      } = generateRefreshToken();

      const newRefreshTokenExpiresAt = new Date();

      newRefreshTokenExpiresAt.setDate(
        newRefreshTokenExpiresAt.getDate() + 30,
      );

      // Cria a nova sessão na mesma família
      // e vinculada à mesma aplicação.
      await createSession(
        user.id,
        session.clientApplicationId,
        newRefreshTokenHash,
        newRefreshTokenExpiresAt,
        session.familyId,
        tx,
      );

      return {
        accessToken,
        refreshToken: newRefreshToken,
      };
    });

    return result;
  } catch (err) {
    /*
     * AppError já representa um erro conhecido
     * e deve chegar ao errorHandler intacto.
     */
    if (err instanceof AppError) {
      throw err;
    }

    /*
     * Qualquer erro inesperado é convertido para um erro
     * genérico antes de chegar ao cliente.
     */
    throw new AppError(
      "INTERNAL_SERVER_ERROR",
      "Erro interno do servidor",
      500,
    );
  }
}

export async function logOut(
  refreshToken: string,
  clientId: string,
  clientSecret: string,
) {
  const clientApplication = await validateClientApplication(
    clientId,
    clientSecret,
  );

  const refreshTokenHash = hashRefreshToken(refreshToken);

  const session = await findSessionByRefreshTokenHash(
    refreshTokenHash,
  );

  /*
   * Logout deve ser idempotente.
   *
   * Se a sessão não existe, consideramos que o usuário
   * já está deslogado.
   */
  if (!session) {
    return "success";
  }

  /*
   * O Refresh Token pertence a uma aplicação específica.
   *
   * Uma aplicação não pode fazer logout utilizando
   * uma sessão pertencente a outra aplicação.
   */
  if (
    session.clientApplicationId !== clientApplication.id
  ) {
    throw new AppError(
      "UNAUTHORIZED",
      "Falha de autenticação",
      401,
    );
  }

  /*
   * Se o token já foi revogado, não precisamos produzir
   * um erro para o cliente.
   *
   * Como existe possibilidade de reutilização desse token,
   * revogamos a família inteira.
   */
  if (session.revokedAt) {
    await revokeSessionFamily(session.familyId);

    return "success";
  }

  await revokeSession(session.id);

  return "success";
}
