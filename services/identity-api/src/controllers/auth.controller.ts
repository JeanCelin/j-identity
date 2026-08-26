import { Request, Response } from "express";

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

export async function register(req: Request, res: Response) {
  try {
    const data = registerSchema.parse(req.body);

    const user = await registerUser(data);

    return res.status(201).json({
      user,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({
      error: "Unable to register user",
    });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const data = loginSchema.parse(req.body);

    const { accessToken, refreshToken } = await loginUser(
      data.email,
      data.password,
    );

    res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, refreshTokenCookieOptions);

    return res.status(200).json({
      accessToken,
    });
  } catch (error) {
    return res.status(401).json({
      error: "Invalid credentials",
    });
  }
}

export async function me(req: Request, res: Response) {
  try {
    const id = req.user.id;

    if (!id)
      return res.status(401).json({
        error: "Não autorizado",
      });

    const data = await getUser(id);

    return res.status(200).json({
      data,
    });
  } catch (error) {
    return res.status(401).json({
      error: "Não autorizado",
    });
  }
}

export async function refresh(req: Request, res: Response) {
  try {
    const refreshToken = req.cookies[REFRESH_TOKEN_COOKIE];

    if (!refreshToken) {
      return res.status(401).json({
        error: "Invalid refresh token",
      });
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
    return res.status(401).json({
      error: "Invalid refresh token",
    });
  }
}

export async function logout(req: Request, res: Response) {
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
  } catch {
    return res.status(500).json({
      error: "Erro ao realizar logout",
    });
  }
}
