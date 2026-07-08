import { Request, Response } from "express";
import { aiService } from "./ai.service";

export class AIController {
  async ask(req: Request, res: Response): Promise<void> {
    try {
      const { question, projectId } = req.body;
      if (!question || typeof question !== "string") {
        res.status(400).json({ error: "Question is required" });
        return;
      }
      const result = await aiService.askQuestion(question, projectId || undefined);
      res.json(result);
    } catch (error: unknown) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to process question" });
    }
  }

  async summary(req: Request, res: Response): Promise<void> {
    try {
      const { projectId, startDate, endDate } = req.query as any;
      const result = await aiService.generateSummary(projectId, startDate, endDate);
      res.json(result);
    } catch (error: unknown) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to generate summary" });
    }
  }
}

export const aiController = new AIController();
