import { Request, Response, NextFunction } from "express";

import { registerSchema, loginSchema } from "../schemas/auth.schema.js";

import {
  getUser,
  refreshAccessToken,
  registerUser,
  loginUser,
  logOut,
} from "../services/auth.service.js";

import { AppError } from "../errors/app-error.js";

export async function register(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const data = registerSchema.parse(req.body);

    const user = await registerUser(data);

    return res.status(201).json({
      user,
    });
  } catch (error) {
    return next(error);
  }
}

export async function login(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const data = loginSchema.parse(req.body);

    const result = await loginUser(
      data.email,
      data.password,
      data.clientId,
      data.clientSecret,
    );

    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
}

export async function me(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const data = await getUser(req.user.id);

    return res.status(200).json({
      data,
    });
  } catch (error) {
    return next(error);
  }
}

export async function refresh(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const {
      refreshToken,
      clientId,
      clientSecret,
    } = req.body;

    if (!refreshToken || !clientId || !clientSecret) {
      throw new AppError(
        "INVALID_TOKEN",
        "Token inválido",
        401,
      );
    }

    const result = await refreshAccessToken(
      refreshToken,
      clientId,
      clientSecret,
    );

    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
}

export async function logout(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const {
      refreshToken,
      clientId,
      clientSecret,
    } = req.body;

    if (!refreshToken || !clientId || !clientSecret) {
      throw new AppError(
        "INVALID_TOKEN",
        "Token inválido",
        401,
      );
    }

    await logOut(
      refreshToken,
      clientId,
      clientSecret,
    );

    return res.status(200).json({
      message: "Deslogado com sucesso.",
    });
  } catch (error) {
    return next(error);
  }
}