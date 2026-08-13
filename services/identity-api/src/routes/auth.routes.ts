import { Router } from "express";
import { refresh, register } from "../controllers/auth.controller";
import { login } from "../controllers/auth.controller";
import { me } from "../controllers/auth.controller";
import { authenticateMiddleware } from "../middleware/authenticate.middleware";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", authenticateMiddleware, me);
router.post("/refresh", refresh)

export default router;
