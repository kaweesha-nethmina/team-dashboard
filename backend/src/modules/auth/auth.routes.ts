import { Router } from "express";
import { authController } from "./auth.controller";
import { authenticate } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { z } from "zod";

const router = Router();

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["MEMBER", "MANAGER"]).optional(),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

router.post("/register", validate(registerSchema), authController.register);
router.post("/login", validate(loginSchema), authController.login);
router.post("/logout", authenticate, authController.logout);
router.get("/me", authenticate, authController.me);

export default router;
