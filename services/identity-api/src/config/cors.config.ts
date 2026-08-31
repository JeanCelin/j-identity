import cors from "cors";

const allowedOrigins =
  process.env.CORS_ORIGINS
    ?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean) ?? [];

export const corsMiddleware = cors({
  origin(origin, callback) {
    console.log("Origin recebida:", origin);

    // Permite requisições sem Origin, como ferramentas de backend e testes.
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error("Origem não permitida pelo CORS"));
  },

  credentials: true,
});