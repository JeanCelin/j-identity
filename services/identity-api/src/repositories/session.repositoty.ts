import { prisma } from "../lib/prisma";

export function createSession(
  userId: string,
  refreshTokenHash: string,
  expiresAt: Date,
) {
  return prisma.session.create({
    data: {
      userId,
      refreshTokenHash,
      expiresAt,
    },
  });
}

export function findSessionByRefreshTokenHash(refreshTokenHash: string) {
  return prisma.session.findUnique({
    where: { refreshTokenHash },
  });
}

export function revokeSession(sessionId: string) {
  return prisma.session.update({
    where: {
      id: sessionId,
    },
    data: {
      revokedAt: new Date(),
    },
  });
}