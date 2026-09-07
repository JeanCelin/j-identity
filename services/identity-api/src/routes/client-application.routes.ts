import { Router } from "express";
import { createClientApplication } from "../controllers/client-application.controller.js";
import { authenticateMiddleware } from "../middleware/authenticate.middleware.js";
import { requireAdminMiddleware } from "../middleware/require-admin.middleware.js";

const router = Router();

router.post("/client-applications", authenticateMiddleware, requireAdminMiddleware, createClientApplication);

export default router;