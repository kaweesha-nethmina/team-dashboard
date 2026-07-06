import { Router } from "express";
import { projectsController } from "./projects.controller";
import { authenticate } from "../../middleware/auth";
import { requireRole } from "../../middleware/role";
import { validate } from "../../middleware/validate";
import { z } from "zod";

const router = Router();

const createProjectSchema = z.object({
  name: z.string().min(1, "Project name is required"),
  description: z.string().optional(),
});

const assignUserSchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
});

router.get("/", authenticate, projectsController.getAll);
router.post("/", authenticate, requireRole("MANAGER"), validate(createProjectSchema), projectsController.create);
router.put("/:id", authenticate, requireRole("MANAGER"), projectsController.update);
router.delete("/:id", authenticate, requireRole("MANAGER"), projectsController.delete);
router.post("/:id/assign", authenticate, requireRole("MANAGER"), validate(assignUserSchema), projectsController.assignUser);
router.delete("/:id/assign/:userId", authenticate, requireRole("MANAGER"), projectsController.removeUser);
router.get("/:id/members", authenticate, projectsController.getMembers);

export default router;
