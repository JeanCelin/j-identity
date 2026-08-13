import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

export function authenticateMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const authorization = req.headers.authorization;
    if (!authorization) {
      return res.status(401).json({ message: "Não autorizado" });
    }
    const [scheme, token] = authorization.split(" ");

    if (scheme !== "Bearer" || !token) {
      return res.status(401).json({
        message: "Não autorizado",
      });
    }

    const jwtsecret = process.env.JWT_SECRET;
    if (!jwtsecret) {
      throw new Error("Falha ao obter assinatura do token");
    }
    const decoded = jwt.verify(token, jwtsecret);

    if (typeof decoded !== "object" || decoded === null) {
      throw new Error("Invalid token payload");
    }
    if (typeof decoded.sub !== "string") {
      throw new Error("Invalid token subject");
    }

    req.user = {
      id: decoded.sub,
    };

    next();
  } catch (err) {
    return res.status(401).json({
      message: "Não autorizado",
    });
  }
}
