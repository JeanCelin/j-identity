import express from "express";

import { loggerMiddleware } from "./middleware/logger.middleware.js";
import { corsMiddleware } from "./middleware/cors.middleware.js";
import { errorHandler } from "./middleware/error-handler.js";

import authRoutes from "./routes/auth.routes.js";
import clientApplicationRoutes from "./routes/client-application.routes.js";
import adminAuthRoutes from "./routes/admin-auth.routes.js";

const app = express();

app.use(express.json());

app.use(corsMiddleware);
app.use(loggerMiddleware);

app.use("/auth", authRoutes);

app.use("/admin", adminAuthRoutes);
app.use("/admin", clientApplicationRoutes);

app.get("/health", (_request, response) => {
  return response.json({
    status: "ok",
  });
});

app.use(errorHandler);

export default app;