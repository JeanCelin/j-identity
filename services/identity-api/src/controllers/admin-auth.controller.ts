import { Request, Response, NextFunction } from "express";

import { adminLoginSchema } from "../schemas/admin-auth.schema.js";
import { loginAdmin } from "../services/admin-auth.service.js";

export async function adminLogin(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const data = adminLoginSchema.parse(req.body);

    const result = await loginAdmin(
      data.email,
      data.password,
    );

    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
}