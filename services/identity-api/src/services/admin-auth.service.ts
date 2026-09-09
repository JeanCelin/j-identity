import bcrypt from "bcrypt";

import { findUserByEmail } from "../repositories/user.repository.js";
import { generateAccessToken } from "./token.service.js";
import { AppError } from "../errors/app-error.js";

export async function loginAdmin(
  email: string,
  password: string,
) {
  const user = await findUserByEmail(email);

  if (!user) {
    throw new AppError(
      "INVALID_CREDENTIALS",
      "Email ou senha inválidos",
      401,
    );
  }

  if (!user.isActive) {
    throw new AppError(
      "INVALID_CREDENTIALS",
      "Email ou senha inválidos",
      401,
    );
  }

  if (user.role !== "ADMIN") {
    throw new AppError(
      "INVALID_CREDENTIALS",
      "Email ou senha inválidos",
      401,
    );
  }

  const passwordMatches = await bcrypt.compare(
    password,
    user.passwordHash,
  );

  if (!passwordMatches) {
    throw new AppError(
      "INVALID_CREDENTIALS",
      "Email ou senha inválidos",
      401,
    );
  }

  const accessToken = generateAccessToken(user.id);

  return {
    accessToken,
  };
}