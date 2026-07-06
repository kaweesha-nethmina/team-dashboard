import { Router } from "express";
import { dashboardController } from "./dashboard.controller";
import { authenticate } from "../../middleware/auth";
import { requireRole } from "../../middleware/role";

const router = Router();

router.get("/summary", authenticate, requireRole("MANAGER"), dashboardController.getSummary);
router.get("/trends", authenticate, requireRole("MANAGER"), dashboardController.getTrends);
router.get("/workload", authenticate, requireRole("MANAGER"), dashboardController.getWorkload);
router.get("/member-status", authenticate, requireRole("MANAGER"), dashboardController.getMemberStatus);
router.get("/recent-activity", authenticate, requireRole("MANAGER"), dashboardController.getRecentActivity);
router.get("/tasks-by-project", authenticate, requireRole("MANAGER"), dashboardController.getTasksByProject);

export default router;
