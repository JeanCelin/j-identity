import { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/app-error.js";

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.code,
      message: err.message,
    });
  }

  console.error(err);

  return res.status(500).json({
    error: "INTERNAL_SERVER_ERROR",
    message: "Erro interno do servidor",
  });
}