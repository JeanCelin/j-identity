import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { AppError } from "../errors/app-error.js";

export function authenticateMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const authorization = req.headers.authorization;

    if (!authorization) {
      throw new AppError(
        "UNAUTHORIZED",
        "Não autorizado",
        401,
      );
    }

    const [scheme, token] = authorization.split(" ");

    if (scheme !== "Bearer" || !token) {
      throw new AppError(
        "INVALID_TOKEN",
        "Token inválido",
        401,
      );
    }

    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      throw new AppError(
        "INTERNAL_SERVER_ERROR",
        "Erro interno do servidor",
        500,
      );
    }

    const decoded = jwt.verify(token, jwtSecret);

    if (typeof decoded !== "object" || decoded === null) {
      throw new AppError(
        "INVALID_TOKEN",
        "Token inválido",
        401,
      );
    }

    if (typeof decoded.sub !== "string") {
      throw new AppError(
        "INVALID_TOKEN",
        "Token inválido",
        401,
      );
    }

    req.user = {
      id: decoded.sub,
    };

    return next();
  } catch (err) {
    if (err instanceof AppError) {
      return next(err);
    }

    if (err instanceof jwt.TokenExpiredError) {
      return next(
        new AppError(
          "TOKEN_EXPIRED",
          "Token expirado",
          401,
        ),
      );
    }

    if (err instanceof jwt.JsonWebTokenError) {
      return next(
        new AppError(
          "INVALID_TOKEN",
          "Token inválido",
          401,
        ),
      );
    }

    return next(err);
  }
}