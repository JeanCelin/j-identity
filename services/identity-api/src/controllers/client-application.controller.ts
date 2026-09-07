import { Request, Response, NextFunction } from "express";
import { createClientApplicationSchema } from "../schemas/client-application.schema.js";
import { createNewClientApplication } from "../services/client-application.service.js";

export async function createClientApplication(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const data = createClientApplicationSchema.parse(req.body);

    const client = await createNewClientApplication(data);

    return res.status(201).json({
      client,
    });
  } catch (error) {
    return next(error);
  }
}