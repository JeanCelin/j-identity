/// <reference types="node" />
import * as crypto from "crypto";

export function generateRefreshToken() {
  const refreshToken = crypto.randomBytes(32).toString("hex");
  const refreshTokenHash = hashRefreshToken(refreshToken)
  
  return { refreshToken, refreshTokenHash };
}

export function hashRefreshToken(refreshToken: string) {
  const refreshTokenHash =  crypto.createHash("sha256").update(refreshToken).digest("hex")
  return refreshTokenHash
}

