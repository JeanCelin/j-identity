import type { CookieOptions } from "express";

export const REFRESH_TOKEN_COOKIE = "refreshToken";

const REFRESH_TOKEN_MAX_AGE = 30 * 24 * 60 * 60 * 1000;

export const refreshTokenCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/auth",
  maxAge: REFRESH_TOKEN_MAX_AGE,
};