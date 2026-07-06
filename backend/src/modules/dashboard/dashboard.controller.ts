import { Request, Response } from "express";
import { dashboardService } from "./dashboard.service";

export class DashboardController {
  async getSummary(_req: Request, res: Response): Promise<void> {
    try {
      const summary = await dashboardService.getSummary();
      res.json(summary);
    } catch (error: unknown) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to load summary" });
    }
  }

  async getTrends(_req: Request, res: Response): Promise<void> {
    try {
      const trends = await dashboardService.getTrends();
      res.json(trends);
    } catch (error: unknown) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to load trends" });
    }
  }

  async getWorkload(_req: Request, res: Response): Promise<void> {
    try {
      const workload = await dashboardService.getWorkload();
      res.json(workload);
    } catch (error: unknown) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to load workload" });
    }
  }

  async getMemberStatus(_req: Request, res: Response): Promise<void> {
    try {
      const status = await dashboardService.getMemberStatus();
      res.json(status);
    } catch (error: unknown) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to load member status" });
    }
  }

  async getRecentActivity(req: Request, res: Response): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const activity = await dashboardService.getRecentActivity(limit);
      res.json(activity);
    } catch (error: unknown) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to load activity" });
    }
  }

  async getTasksByProject(_req: Request, res: Response): Promise<void> {
    try {
      const data = await dashboardService.getTasksByProject();
      res.json(data);
    } catch (error: unknown) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to load tasks" });
    }
  }
}

export const dashboardController = new DashboardController();
