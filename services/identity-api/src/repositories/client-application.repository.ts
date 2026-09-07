import { prisma } from "../lib/prisma.js";

type CreateClientApplicationData = {
  name: string;
  clientId: string;
  clientSecretHash: string;
};

export async function createClientApplication(
  data: CreateClientApplicationData,
) {
  return prisma.clientApplication.create({
    data,
  });
}

export async function findClientApplicationByClientId(
  clientId: string,
) {
  return prisma.clientApplication.findUnique({
    where: {
      clientId,
    },
  });
}