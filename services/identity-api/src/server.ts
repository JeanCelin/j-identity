import express from "express";
import { loggerMiddleware } from "./middleware/logger.middleware";
import authRoutes from "../src/routes/auth.routes";


const app = express();

const PORT = 3001;
app.use(express.json());

//app.use registra um middleware, importante o middleware ser chamado antes da rota.
app.use(loggerMiddleware);
app.use("/auth", authRoutes);
app.get("/health", (request, response) => {
  return response.json({
    status: "ok",
  });
});


app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
