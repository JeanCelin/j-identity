import {
  createUser,
  findUserByEmail,
  findUserById,
} from "../repositories/user.repository";

import bcrypt from "bcrypt";

import { generateAccessToken } from "./token.service";

import {
  generateRefreshToken,
  hashRefreshToken,
} from "./refresh-token.service";

import {
  createSession,
  findSessionByRefreshTokenHash,
  revokeSession,
} from "../repositories/session.repositoty";

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

export async function loginUser(
  email: string,
  password: string,
) {
  const user = await findUserByEmail(email);

  if (!user) {
    throw new Error("INVALID_CREDENTIALS");
  }

  const passwordMatches = await bcrypt.compare(
    password,
    user.passwordHash,
  );

  if (!passwordMatches) {
    throw new Error("INVALID_CREDENTIALS");
  }

  if (!user.isActive) {
    throw new Error("INVALID_CREDENTIALS");
  }

  const accessToken = generateAccessToken(user.id);

  const {
    refreshToken,
    refreshTokenHash,
  } = generateRefreshToken();

  const refreshTokenExpiresAt = new Date();

  refreshTokenExpiresAt.setDate(
    refreshTokenExpiresAt.getDate() + 30,
  );

  await createSession(
    user.id,
    refreshTokenHash,
    refreshTokenExpiresAt,
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

export async function refreshAccessToken(
  refreshToken: string,
) {
  const refreshTokenHash = hashRefreshToken(refreshToken);

  const session =
    await findSessionByRefreshTokenHash(refreshTokenHash);

  if (!session) {
    throw new Error("Falha de autenticação");
  }

  if (session.revokedAt) {
    throw new Error("Falha de autenticação");
  }

  if (session.expiresAt <= new Date()) {
    throw new Error("Falha de autenticação");
  }

  const user = await findUserById(session.userId);

  if (!user) {
    throw new Error("Falha de autenticação");
  }

  if (!user.isActive) {
    throw new Error("Falha de autenticação");
  }

  // A Session antiga deixa de ser válida.
  await revokeSession(session.id);

  const accessToken = generateAccessToken(user.id);

  // Geramos UM novo Refresh Token.
  const {
    refreshToken: newRefreshToken,
    refreshTokenHash: newRefreshTokenHash,
  } = generateRefreshToken();

  const newRefreshTokenExpiresAt = new Date();

  newRefreshTokenExpiresAt.setDate(
    newRefreshTokenExpiresAt.getDate() + 30,
  );

  // Criamos a nova Session associada ao novo Refresh Token.
  await createSession(
    user.id,
    newRefreshTokenHash,
    newRefreshTokenExpiresAt,
  );

  return {
    accessToken,
    refreshToken: newRefreshToken,
  };
}