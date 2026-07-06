import { Router } from "express";
import { reportsController } from "./reports.controller";
import { authenticate } from "../../middleware/auth";
import { requireRole } from "../../middleware/role";
import { validate } from "../../middleware/validate";
import { z } from "zod";

const router = Router();

const createReportSchema = z.object({
  projectId: z.string().uuid("Invalid project ID"),
  weekStartDate: z.string(),
  weekEndDate: z.string(),
  tasksCompleted: z.string().min(1, "Tasks completed is required"),
  tasksPlanned: z.string().min(1, "Tasks planned is required"),
  blockers: z.string().optional(),
  hoursWorked: z.number().positive().optional(),
  notes: z.string().optional(),
});

router.get("/me", authenticate, requireRole("MEMBER", "MANAGER"), reportsController.getMyReports);
router.post("/", authenticate, requireRole("MEMBER"), validate(createReportSchema), reportsController.create);
router.put("/:id", authenticate, requireRole("MEMBER"), reportsController.update);
router.post("/:id/submit", authenticate, requireRole("MEMBER"), reportsController.submit);
router.get("/", authenticate, requireRole("MANAGER"), reportsController.getAll);
router.get("/status", authenticate, requireRole("MANAGER"), reportsController.getSubmissionStatus);
router.get("/:id", authenticate, reportsController.getById);

export default router;
