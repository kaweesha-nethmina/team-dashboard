import { describe, it, expect, vi, beforeEach } from "vitest";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

vi.mock("../../config/prisma", () => ({
  default: {
    user: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
    },
  },
}));

import prisma from "../../config/prisma";
import { authService } from "./auth.service";

const mockUser = {
  id: "user-1",
  name: "Test User",
  email: "test@example.com",
  passwordHash: bcrypt.hashSync("password123", 12),
  role: "MEMBER",
  createdAt: new Date().toISOString(),
};

const mockManager = { ...mockUser, id: "manager-1", email: "manager@example.com", role: "MANAGER" };

describe("AuthService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("register", () => {
    it("should register a new user and return token", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.user.create).mockResolvedValue(mockUser);

      const result = await authService.register("Test User", "test@example.com", "password123");

      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email: "test@example.com" } });
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: { name: "Test User", email: "test@example.com", passwordHash: expect.any(String), role: "MEMBER" },
      });
      expect(result.user.email).toBe("test@example.com");
      expect(result.token).toBeTruthy();
      const decoded = jwt.decode(result.token) as any;
      expect(decoded.userId).toBe("user-1");
    });

    it("should throw when email already exists", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);

      await expect(authService.register("Test", "test@example.com", "password123"))
        .rejects.toThrow("Email already registered");
      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it("should register a manager when role is specified", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.user.create).mockResolvedValue(mockManager);

      const result = await authService.register("Manager", "manager@example.com", "password123", "MANAGER");

      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ role: "MANAGER" }),
        })
      );
      expect(result.user.role).toBe("MANAGER");
    });
  });

  describe("login", () => {
    it("should login with valid credentials", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);

      const result = await authService.login("test@example.com", "password123");

      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email: "test@example.com" } });
      expect(result.user.email).toBe("test@example.com");
      expect(result.token).toBeTruthy();
    });

    it("should throw with wrong password", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);

      await expect(authService.login("test@example.com", "wrongpassword"))
        .rejects.toThrow("Invalid email or password");
    });

    it("should throw when user not found", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      await expect(authService.login("nonexistent@example.com", "password123"))
        .rejects.toThrow("Invalid email or password");
    });
  });

  describe("getMe", () => {
    it("should return user by id", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: "user-1",
        name: "Test User",
        email: "test@example.com",
        role: "MEMBER",
        createdAt: mockUser.createdAt,
      });

      const result = await authService.getMe("user-1");

      expect(result.name).toBe("Test User");
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: "user-1" },
        select: { id: true, name: true, email: true, role: true, createdAt: true },
      });
    });

    it("should throw when user not found", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      await expect(authService.getMe("nonexistent")).rejects.toThrow("User not found");
    });
  });

  describe("getMembers", () => {
    it("should return all members without search", async () => {
      vi.mocked(prisma.user.findMany).mockResolvedValue([mockUser]);

      const result = await authService.getMembers();

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { role: "MEMBER" },
          orderBy: { name: "asc" },
        })
      );
      expect(result).toHaveLength(1);
    });

    it("should search members by name or email", async () => {
      vi.mocked(prisma.user.findMany).mockResolvedValue([mockUser]);

      const result = await authService.getMembers("test");

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            role: "MEMBER",
            OR: [
              { name: { ilike: "%test%" } },
              { email: { ilike: "%test%" } },
            ],
          },
        })
      );
      expect(result).toHaveLength(1);
    });
  });
});
