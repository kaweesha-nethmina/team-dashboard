import { Request, Response } from "express";
import { reportsService } from "./reports.service";

export class ReportsController {
  async getMyReports(req: Request, res: Response): Promise<void> {
    try {
      const page = req.query.page ? parseInt(req.query.page as string) : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const projectId = req.query.projectId as string | undefined;
      const reports = await reportsService.getMyReports(req.user!.userId, page, limit, projectId);
      res.json(reports);
    } catch (error: unknown) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to load reports" });
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const report = await reportsService.createReport(req.user!.userId, req.body);
      res.status(201).json(report);
    } catch (error: unknown) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to create report" });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const report = await reportsService.updateReport(req.params.id, req.user!.userId, req.body);
      res.json(report);
    } catch (error: unknown) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to update report" });
    }
  }

  async submit(req: Request, res: Response): Promise<void> {
    try {
      const report = await reportsService.submitReport(req.params.id, req.user!.userId);
      res.json(report);
    } catch (error: unknown) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to submit report" });
    }
  }

  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const filters = {
        ...req.query,
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      } as any;
      const reports = await reportsService.getAllReports(filters);
      res.json(reports);
    } catch (error: unknown) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to load reports" });
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const report = await reportsService.getReportById(req.params.id);
      if (!report) {
        res.status(404).json({ error: "Report not found" });
        return;
      }
      res.json(report);
    } catch (error: unknown) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to load report" });
    }
  }

  async getSubmissionStatus(_req: Request, res: Response): Promise<void> {
    try {
      const status = await reportsService.getSubmissionStatus();
      res.json(status);
    } catch (error: unknown) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to load status" });
    }
  }
}

export const reportsController = new ReportsController();
