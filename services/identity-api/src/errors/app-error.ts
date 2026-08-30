import type { ErrorCode } from "../types/error-code.js";

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: ErrorCode;

  constructor(
    code: ErrorCode,
    message: string,
    statusCode: number,
  ) {
    super(message);

    this.name = "AppError";
    this.code = code;
    this.statusCode = statusCode;
  }
}