import { Router } from "express";
import { aiController } from "./ai.controller";
import { authenticate } from "../../middleware/auth";
import { requireRole } from "../../middleware/role";
import { validate } from "../../middleware/validate";
import { z } from "zod";

const router = Router();

const askSchema = z.object({
  question: z.string().min(1, "Question is required"),
});

router.post("/ask", authenticate, requireRole("MANAGER"), validate(askSchema), aiController.ask);
router.get("/summary", authenticate, requireRole("MANAGER"), aiController.summary);

export default router;
