import { describe, it, expect, vi, beforeEach } from "vitest";

let supabaseResult: any = { data: [], error: null, count: 0 };

const mockSupabase = vi.hoisted(() => {
  const chain: any = {
    select: () => chain,
    eq: () => chain,
    in: () => chain,
    order: () => chain,
    limit: () => chain,
    range: () => chain,
    or: () => chain,
    neq: () => chain,
    gte: () => chain,
    lte: () => chain,
    single: () => Promise.resolve(supabaseResult),
    then: (onfulfilled: any) => Promise.resolve(supabaseResult).then(onfulfilled),
  };
  return { from: vi.fn(() => chain) };
});

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => mockSupabase),
}));

vi.mock("../../config/prisma", () => ({
  default: {
    project: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    projectAssignment: {
      findMany: vi.fn(),
      create: vi.fn(),
      deleteMany: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
    report: {
      deleteMany: vi.fn(),
    },
  },
}));

import prisma from "../../config/prisma";
import { projectsService } from "./projects.service";

const mockProject = {
  id: "proj-1",
  name: "Frontend Redesign",
  description: "Redesign the main dashboard UI",
  createdById: "manager-1",
  createdAt: new Date().toISOString(),
  createdBy: { id: "manager-1", name: "Alice Manager" },
  _count: { reports: 3 },
};

const mockUser = {
  id: "member-1",
  name: "Bob Member",
  email: "member@teamdash.com",
  role: "MEMBER",
};

describe("ProjectsService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getAll", () => {
    it("should return all projects", async () => {
      vi.mocked(prisma.project.findMany).mockResolvedValue([mockProject]);
      supabaseResult = { data: [{ projectId: "proj-1" }, { projectId: "proj-1" }, { projectId: "proj-1" }], error: null };

      const result = await projectsService.getAll();

      expect(prisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: "desc" },
        })
      );
      expect(result).toHaveLength(1);
      expect(result[0]._count.reports).toBe(3);
    });

    it("should return assigned-only projects", async () => {
      vi.mocked(prisma.projectAssignment.findMany).mockResolvedValue([
        { projectId: "proj-1", userId: "member-1" },
      ]);
      vi.mocked(prisma.project.findMany).mockResolvedValue([mockProject]);
      supabaseResult = { data: [{ projectId: "proj-1" }, { projectId: "proj-1" }], error: null };

      const result = await projectsService.getAll("member-1", true);

      expect(prisma.projectAssignment.findMany).toHaveBeenCalledWith({
        where: { userId: "member-1" },
        select: { projectId: true },
      });
      expect(prisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: { in: ["proj-1"] } },
        })
      );
      expect(result).toHaveLength(1);
      expect(result[0]._count.reports).toBe(2);
    });

    it("should return empty array when no assignments", async () => {
      vi.mocked(prisma.projectAssignment.findMany).mockResolvedValue([]);

      const result = await projectsService.getAll("member-1", true);

      expect(result).toEqual([]);
    });
  });

  describe("create", () => {
    it("should create a project", async () => {
      vi.mocked(prisma.project.create).mockResolvedValue(mockProject);

      const result = await projectsService.create("Frontend Redesign", "Description", "manager-1");

      expect(prisma.project.create).toHaveBeenCalledWith({
        data: { name: "Frontend Redesign", description: "Description", createdById: "manager-1" },
        include: { createdBy: { select: { id: true, name: true } } },
      });
      expect(result.name).toBe("Frontend Redesign");
    });
  });

  describe("update", () => {
    it("should update a project", async () => {
      vi.mocked(prisma.project.findUnique).mockResolvedValue(mockProject);
      vi.mocked(prisma.project.update).mockResolvedValue({ ...mockProject, name: "Updated Name" });

      const result = await projectsService.update("proj-1", { name: "Updated Name" });

      expect(prisma.project.update).toHaveBeenCalledWith({
        where: { id: "proj-1" },
        data: { name: "Updated Name" },
        include: { createdBy: { select: { id: true, name: true } } },
      });
      expect(result.name).toBe("Updated Name");
    });

    it("should throw when not found", async () => {
      vi.mocked(prisma.project.findUnique).mockResolvedValue(null);

      await expect(projectsService.update("nonexistent", { name: "New" }))
        .rejects.toThrow("Project not found");
    });
  });

  describe("delete", () => {
    it("should delete a project and related data", async () => {
      vi.mocked(prisma.project.findUnique).mockResolvedValue(mockProject);
      vi.mocked(prisma.report.deleteMany).mockResolvedValue({ count: 3 });
      vi.mocked(prisma.projectAssignment.deleteMany).mockResolvedValue({ count: 2 });
      vi.mocked(prisma.project.delete).mockResolvedValue(mockProject);

      const result = await projectsService.delete("proj-1");

      expect(prisma.report.deleteMany).toHaveBeenCalledWith({ where: { projectId: "proj-1" } });
      expect(prisma.projectAssignment.deleteMany).toHaveBeenCalledWith({ where: { projectId: "proj-1" } });
      expect(prisma.project.delete).toHaveBeenCalledWith({ where: { id: "proj-1" } });
      expect(result.message).toBe("Project deleted successfully");
    });
  });

  describe("assignUserByEmail", () => {
    it("should assign user by email", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);
      vi.mocked(prisma.projectAssignment.findMany).mockResolvedValue([]);
      vi.mocked(prisma.projectAssignment.create).mockResolvedValue({
        projectId: "proj-1",
        userId: "member-1",
        user: mockUser,
      });

      const result = await projectsService.assignUserByEmail("proj-1", "member@teamdash.com");

      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email: "member@teamdash.com" } });
      expect(prisma.projectAssignment.create).toHaveBeenCalledWith({
        data: { projectId: "proj-1", userId: "member-1" },
        include: { user: { select: { id: true, name: true, email: true } } },
      });
      expect(result.user.email).toBe("member@teamdash.com");
    });

    it("should throw when user not found", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      await expect(projectsService.assignUserByEmail("proj-1", "nonexistent@email.com"))
        .rejects.toThrow("User not found with that email");
    });

    it("should throw when already assigned", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);
      vi.mocked(prisma.projectAssignment.findMany).mockResolvedValue([{ projectId: "proj-1", userId: "member-1" }]);

      await expect(projectsService.assignUserByEmail("proj-1", "member@teamdash.com"))
        .rejects.toThrow("User is already assigned to this project");
    });
  });

  describe("removeUser", () => {
    it("should remove user from project", async () => {
      vi.mocked(prisma.projectAssignment.deleteMany).mockResolvedValue({ count: 1 });

      const result = await projectsService.removeUser("proj-1", "member-1");

      expect(prisma.projectAssignment.deleteMany).toHaveBeenCalledWith({
        where: { projectId: "proj-1", userId: "member-1" },
      });
      expect(result.message).toBe("User removed from project");
    });
  });

  describe("getById", () => {
    it("should return project by id", async () => {
      vi.mocked(prisma.project.findUnique).mockResolvedValue(mockProject);
      supabaseResult = { data: null, error: null, count: 5 };

      const result = await projectsService.getById("proj-1");

      expect(result.id).toBe("proj-1");
      expect(result.name).toBe("Frontend Redesign");
      expect(result._count.reports).toBe(5);
    });

    it("should throw when not found", async () => {
      vi.mocked(prisma.project.findUnique).mockResolvedValue(null);

      await expect(projectsService.getById("nonexistent"))
        .rejects.toThrow("Project not found");
    });
  });

  describe("getProjectMembers", () => {
    it("should return project members", async () => {
      vi.mocked(prisma.projectAssignment.findMany).mockResolvedValue([
        { projectId: "proj-1", userId: "member-1", user: mockUser },
      ]);

      const result = await projectsService.getProjectMembers("proj-1");

      expect(result).toHaveLength(1);
      expect(result[0].email).toBe("member@teamdash.com");
    });
  });
});
