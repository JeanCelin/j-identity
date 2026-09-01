import express from "express";

import cookieParser from "cookie-parser";

import { loggerMiddleware } from "./middleware/logger.middleware.js";
import { corsMiddleware } from "./middleware/cors.middleware.js";
import { errorHandler } from "./middleware/error-handler.js";

import authRoutes from "./routes/auth.routes.js";

const app = express();

app.use(express.json());

app.use(cookieParser());

app.use(corsMiddleware);

app.use(loggerMiddleware);

app.use("/auth", authRoutes);

app.get("/health", (_request, response) => {
  return response.json({
    status: "ok",
  });
});

app.use(errorHandler);

export default app;