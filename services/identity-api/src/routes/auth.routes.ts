import { Router } from "express";
import {
  login,
  logout,
  me,
  refresh,
  register,
} from "../controllers/auth.controller.js";
import { authenticateMiddleware } from "../middleware/authenticate.middleware.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", authenticateMiddleware, me);
router.post("/refresh", refresh);
router.post("/logout", logout);

export default router;
