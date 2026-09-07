import bcrypt from "bcrypt";

import { generateSecureRandomToken } from "./refresh-token.service.js";

import {
  createClientApplication,
  findClientApplicationByClientId,
} from "../repositories/client-application.repository.js";

import { AppError } from "../errors/app-error.js";

type CreateClientApplicationData = {
  name: string;
};

export async function createNewClientApplication(
  data: CreateClientApplicationData,
) {
  const clientId = generateSecureRandomToken();

  const clientSecret = generateSecureRandomToken();

  const clientSecretHash = await bcrypt.hash(clientSecret, 12);

  const client = await createClientApplication({
    name: data.name,
    clientId,
    clientSecretHash,
  });

  return {
    id: client.id,
    name: client.name,
    clientId,
    clientSecret,
    isActive: client.isActive,
    createdAt: client.createdAt,
  };
}

export async function validateClientApplication(
  clientId: string,
  clientSecret: string,
) {
  const client = await findClientApplicationByClientId(clientId);

  if (!client) {
    throw new AppError(
      "INVALID_CLIENT",
      "Aplicação não autorizada",
      401,
    );
  }

  if (!client.isActive) {
    throw new AppError(
      "INVALID_CLIENT",
      "Aplicação não autorizada",
      401,
    );
  }

  const secretMatches = await bcrypt.compare(
    clientSecret,
    client.clientSecretHash,
  );

  if (!secretMatches) {
    throw new AppError(
      "INVALID_CLIENT",
      "Aplicação não autorizada",
      401,
    );
  }

  return client;
}