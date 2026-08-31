import "dotenv/config";

import express from "express";

import { loggerMiddleware } from "./middleware/logger.middleware.js";
import { corsMiddleware } from "./middleware/cors.middleware.js";
import cookieParser from "cookie-parser";

import authRoutes from "./routes/auth.routes.js";
import { errorHandler } from "./middleware/error-handler.js";

const app = express();

const PORT = Number(process.env.PORT) || 3001;

app.use(express.json());
app.use(cookieParser());

app.use(corsMiddleware);

app.use(loggerMiddleware);

app.use("/auth", authRoutes);

app.get("/health", (request, response) => {
  return response.json({
    status: "ok",
  });
});

app.use(errorHandler);



app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
