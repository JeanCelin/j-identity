import { Request, Response, NextFunction } from "express";

import { registerSchema, loginSchema } from "../schemas/auth.schema.js";
import {
  REFRESH_TOKEN_COOKIE,
  refreshTokenCookieOptions,
} from "../config/cookie.js";
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

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const data = loginSchema.parse(req.body);

    const { accessToken, refreshToken } = await loginUser(
      data.email,
      data.password,
      data.clientId,
      data.clientSecret
    );

    res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, refreshTokenCookieOptions);

    return res.status(200).json({
      accessToken,
    });
  } catch (error) {
    return next(error);
  }
}

export async function me(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await getUser(req.user.id);

    return res.status(200).json({
      data,
    });
  } catch (error) {
    return next(error);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const refreshToken = req.cookies[REFRESH_TOKEN_COOKIE];

    if (!refreshToken) {
      throw new AppError("INVALID_TOKEN", "Token inválido", 401);
    }

    const { accessToken, refreshToken: newRefreshToken } =
      await refreshAccessToken(refreshToken);

    res.cookie(
      REFRESH_TOKEN_COOKIE,
      newRefreshToken,
      refreshTokenCookieOptions,
    );

    return res.status(200).json({
      accessToken,
    });
  } catch (error) {
    return next(error);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    const refreshToken = req.cookies[REFRESH_TOKEN_COOKIE];

    if (refreshToken) {
      await logOut(refreshToken);
    }

    res.clearCookie(REFRESH_TOKEN_COOKIE, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/auth",
    });

    return res.status(200).json({
      message: "Deslogado com sucesso.",
    });
  } catch (error) {
    return next(error);
  }
}
