import { prisma } from "../lib/prisma.js";
import { DbClient } from "../types/db-client.js";

export function createSession(
  userId: string,
  refreshTokenHash: string,
  expiresAt: Date,
  familyId: string,
  db: DbClient = prisma
) {
  return db.session.create({
    data: {
      userId,
      refreshTokenHash,
      expiresAt,
      familyId,
    },
  });
}

export function findSessionByRefreshTokenHash(refreshTokenHash: string) {
  return prisma.session.findUnique({
    where: { refreshTokenHash },
  });
}

export function revokeSession(sessionId: string, db: DbClient = prisma) {
  return db.session.update({
    where: {
      id: sessionId,
    },
    data: {
      revokedAt: new Date(),
    },
  });
}

export function revokeSessionFamily(familyId: string) {
  return prisma.session.updateMany({
    where: {
      familyId,
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
    },
  });
}
