import { Request, Response } from "express";
import { authService } from "./auth.service";

export class AuthController {
  async register(req: Request, res: Response): Promise<void> {
    try {
      const { name, email, password, role } = req.body;
      const result = await authService.register(name, email, password, role);

      res.cookie("token", result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.status(201).json(result);
    } catch (error: unknown) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Registration failed" });
    }
  }

  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);

      res.cookie("token", result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.json(result);
    } catch (error: unknown) {
      res.status(401).json({ error: error instanceof Error ? error.message : "Login failed" });
    }
  }

  async logout(_req: Request, res: Response): Promise<void> {
    res.clearCookie("token");
    res.json({ message: "Logged out successfully" });
  }

  async me(req: Request, res: Response): Promise<void> {
    try {
      const user = await authService.getMe(req.user!.userId);
      res.json(user);
    } catch (error: unknown) {
      res.status(404).json({ error: error instanceof Error ? error.message : "User not found" });
    }
  }

  async members(req: Request, res: Response): Promise<void> {
    try {
      const search = req.query.search as string | undefined;
      const users = await authService.getMembers(search);
      res.json(users);
    } catch (error: unknown) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to load members" });
    }
  }
}

export const authController = new AuthController();
