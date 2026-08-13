import jwt from "jsonwebtoken";

export  function generateAccessToken(userId: string) {
  const SECRET = process.env.JWT_SECRET;
  if (!SECRET) {
    throw new Error("Falha ao assinar token");
  }
  return jwt.sign({ sub: userId }, SECRET, { expiresIn: "15m" });
}
