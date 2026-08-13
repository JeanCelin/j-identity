import { Request, Response } from "express";

import {
  registerSchema,
  loginSchema,
} from "../schemas/auth.schema";

import {
  getUser,
  refreshAccessToken,
  registerUser,
  loginUser,
} from "../services/auth.service";

export async function register(
  req: Request,
  res: Response,
) {
  try {
    const data = registerSchema.parse(req.body);

    const user = await registerUser(data);

    return res.status(201).json({
      user,
    });
  } catch (error) {
    return res.status(400).json({
      error: "Unable to register user",
    });
  }
}

export async function login(
  req: Request,
  res: Response,
) {
  try {
    const data = loginSchema.parse(req.body);

    const { accessToken, refreshToken } =
      await loginUser(
        data.email,
        data.password,
      );

    return res.status(200).json({
      accessToken,
      refreshToken,
    });
  } catch (error) {
    return res.status(401).json({
      error: "Invalid credentials",
    });
  }
}

export async function me(
  req: Request,
  res: Response,
) {
  try {
    const id = req.user.id;

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

export async function refresh(
  req: Request,
  res: Response,
) {
  try {
    const { refreshToken } = req.body;

    const {
      accessToken,
      refreshToken: newRefreshToken,
    } = await refreshAccessToken(refreshToken);

    return res.status(200).json({
      accessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    return res.status(401).json({
      error: "Invalid refresh token",
    });
  }
}