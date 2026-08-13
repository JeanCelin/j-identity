import { Request, Response } from "express";

export function health(request: Request, response: Response) {
  return response.json({
    status: "ok",
  });
}