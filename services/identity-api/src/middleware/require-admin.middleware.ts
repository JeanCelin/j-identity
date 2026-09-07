import { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/app-error.js";

export function requireAdminMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (req.user.role !== "ADMIN") {
    return next(
      new AppError(
        "FORBIDDEN",
        "Acesso negado",
        403,
      ),
    );
  }

  return next();
}