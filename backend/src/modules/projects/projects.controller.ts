import { Request, Response } from "express";
import { projectsService } from "./projects.service";

export class ProjectsController {
  async getAll(_req: Request, res: Response): Promise<void> {
    try {
      const projects = await projectsService.getAll();
      res.json(projects);
    } catch (error: unknown) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to load projects" });
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const { name, description } = req.body;
      const project = await projectsService.create(name, description, req.user!.userId);
      res.status(201).json(project);
    } catch (error: unknown) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to create project" });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const project = await projectsService.update(req.params.id, req.body);
      res.json(project);
    } catch (error: unknown) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to update project" });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const result = await projectsService.delete(req.params.id);
      res.json(result);
    } catch (error: unknown) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to delete project" });
    }
  }

  async assignUser(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.body;
      const assignment = await projectsService.assignUser(req.params.id, userId);
      res.status(201).json(assignment);
    } catch (error: unknown) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to assign user" });
    }
  }

  async removeUser(req: Request, res: Response): Promise<void> {
    try {
      const result = await projectsService.removeUser(req.params.id, req.params.userId);
      res.json(result);
    } catch (error: unknown) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to remove user" });
    }
  }

  async getMembers(req: Request, res: Response): Promise<void> {
    try {
      const members = await projectsService.getProjectMembers(req.params.id);
      res.json(members);
    } catch (error: unknown) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to load members" });
    }
  }
}

export const projectsController = new ProjectsController();
