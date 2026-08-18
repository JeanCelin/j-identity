import { PrismaClient, Prisma } from "@prisma/client";

export type DbClient =
  | PrismaClient
  | Prisma.TransactionClient;