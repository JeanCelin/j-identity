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

type RegisterData = {
  name: string;
  email: string;
  password: string;
};

export async function registerUser(data: RegisterData) {
  const existingUser = await findUserByEmail(data.email);

  if (existingUser) {
    throw new Error("User already exists");
  }

  const passwordHash = await bcrypt.hash(data.password, 12);

  const user = await createUser({
    name: data.name,
    email: data.email,
    passwordHash,
  });

  const { passwordHash: _, ...safeUser } = user;

  return safeUser;
}

export async function loginUser(email: string, password: string) {
  const user = await findUserByEmail(email);

  if (!user) {
    throw new Error("INVALID_CREDENTIALS");
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);

  if (!passwordMatches) {
    throw new Error("INVALID_CREDENTIALS");
  }

  if (!user.isActive) {
    throw new Error("INVALID_CREDENTIALS");
  }

  const accessToken = generateAccessToken(user.id);

  const { refreshToken, refreshTokenHash } = generateRefreshToken();

  const refreshTokenExpiresAt = new Date();

  refreshTokenExpiresAt.setDate(refreshTokenExpiresAt.getDate() + 30);

  const familyId = generateSecureRandomToken();

  await createSession(
    user.id,
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

  if (!user) {
    throw new Error("Falha ao obter usuário");
  }

  return user;
}

export async function refreshAccessToken(refreshToken: string) {
  try {
    const refreshTokenHash = hashRefreshToken(refreshToken);
    const session = await findSessionByRefreshTokenHash(refreshTokenHash);
    if (!session) {
      throw new Error();
    }

    if (session.revokedAt) {
      await revokeSessionFamily(session.familyId);

      throw new Error();
    }

    if (session.expiresAt <= new Date()) {
      throw new Error();
    }

    const user = await findUserById(session.userId);

    if (!user) {
      throw new Error();
    }

    if (!user.isActive) {
      throw new Error();
    }
    const result = await prisma.$transaction(async (tx) => {
      // A Session antiga deixa de ser válida.
      await revokeSession(session.id, tx);
      // throw new Error("TESTE DE ROLLBACK");
      const accessToken = generateAccessToken(user.id);

      // Geramos UM novo Refresh Token.
      const {
        refreshToken: newRefreshToken,
        refreshTokenHash: newRefreshTokenHash,
      } = generateRefreshToken();

      const newRefreshTokenExpiresAt = new Date();

      newRefreshTokenExpiresAt.setDate(newRefreshTokenExpiresAt.getDate() + 30);

      // Criamos a nova Session associada ao novo Refresh Token.
      await createSession(
        user.id,
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
    throw new Error("Falha de autenticação");
  }
}

export async function logOut(refreshToken: string) {
  const refreshTokenHash = hashRefreshToken(refreshToken);

  const session = await findSessionByRefreshTokenHash(refreshTokenHash);
  if (!session) {
    return "success";
  }

  if (session?.revokedAt != null) {
    await revokeSessionFamily(session.familyId);
    return "success";
  }

  await revokeSession(session.id);

  return "success";
}
