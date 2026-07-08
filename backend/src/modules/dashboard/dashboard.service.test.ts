import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../config/prisma", () => ({
  default: {
    user: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
    report: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
    project: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

import prisma from "../../config/prisma";
import { dashboardService } from "./dashboard.service";

describe("DashboardService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getSummary", () => {
    it("should return summary metrics", async () => {
      vi.mocked(prisma.user.count).mockResolvedValue(5);
      vi.mocked(prisma.report.count)
        .mockResolvedValueOnce(20)
        .mockResolvedValueOnce(15)
        .mockResolvedValueOnce(4)
        .mockResolvedValueOnce(1);
      vi.mocked(prisma.project.count).mockResolvedValue(3);
      vi.mocked(prisma.report.findMany).mockResolvedValue([
        { blockers: "Blocker 1" },
        { blockers: "Blocker 2" },
        { blockers: "" },
      ]);

      const result = await dashboardService.getSummary();

      expect(result.totalMembers).toBe(5);
      expect(result.totalReports).toBe(20);
      expect(result.submittedReports).toBe(15);
      expect(result.draftReports).toBe(4);
      expect(result.lateReports).toBe(1);
      expect(result.totalProjects).toBe(3);
      expect(result.openBlockers).toBe(2);
      expect(result.complianceRate).toBe(75);
    });

    it("should handle zero reports", async () => {
      vi.mocked(prisma.user.count).mockResolvedValue(0);
      vi.mocked(prisma.report.count)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);
      vi.mocked(prisma.project.count).mockResolvedValue(0);
      vi.mocked(prisma.report.findMany).mockResolvedValue([]);

      const result = await dashboardService.getSummary();

      expect(result.complianceRate).toBe(0);
      expect(result.totalReports).toBe(0);
    });
  });

  describe("getTrends", () => {
    it("should return trends grouped by week", async () => {
      vi.mocked(prisma.report.findMany).mockResolvedValue([
        { weekStartDate: new Date("2026-06-29"), status: "SUBMITTED", hoursWorked: 40 },
        { weekStartDate: new Date("2026-06-29"), status: "DRAFT", hoursWorked: 35 },
        { weekStartDate: new Date("2026-07-06"), status: "SUBMITTED", hoursWorked: 40 },
      ]);

      const result = await dashboardService.getTrends();

      expect(result).toHaveLength(2);
      expect(result[0].week).toBe("2026-06-29");
      expect(result[0].submitted).toBe(1);
      expect(result[0].draft).toBe(1);
      expect(result[0].totalHours).toBe(75);
      expect(result[1].week).toBe("2026-07-06");
      expect(result[1].submitted).toBe(1);
    });
  });

  describe("getWorkload", () => {
    it("should return workload by project", async () => {
      vi.mocked(prisma.project.findMany).mockResolvedValue([
        {
          id: "proj-1",
          name: "Frontend",
          _count: { reports: 5 },
          reports: [{ hoursWorked: 40 }, { hoursWorked: 35 }],
        },
        {
          id: "proj-2",
          name: "Backend",
          _count: { reports: 3 },
          reports: [{ hoursWorked: 20 }, { hoursWorked: null }],
        },
      ]);

      const result = await dashboardService.getWorkload();

      expect(result).toHaveLength(2);
      expect(result[0].projectName).toBe("Frontend");
      expect(result[0].reportCount).toBe(5);
      expect(result[0].totalHours).toBe(75);
      expect(result[1].projectName).toBe("Backend");
      expect(result[1].totalHours).toBe(20);
    });
  });

  describe("getMemberStatus", () => {
    it("should return status for each member", async () => {
      vi.mocked(prisma.user.findMany).mockResolvedValue([
        {
          id: "user-1",
          name: "Alice",
          email: "alice@test.com",
          reports: [
            { status: "SUBMITTED", weekStartDate: new Date("2026-07-06") },
            { status: "SUBMITTED", weekStartDate: new Date("2026-06-29") },
            { status: "DRAFT", weekStartDate: new Date("2026-06-22") },
          ],
        },
        {
          id: "user-2",
          name: "Bob",
          email: "bob@test.com",
          reports: [
            { status: "DRAFT", weekStartDate: new Date("2026-07-06") },
          ],
        },
      ]);

      const result = await dashboardService.getMemberStatus();

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe("Alice");
      expect(result[0].totalReports).toBe(3);
      expect(result[0].submitted).toBe(2);
      expect(result[0].draft).toBe(1);
      expect(result[1].name).toBe("Bob");
      expect(result[1].submitted).toBe(0);
    });
  });

  describe("getRecentActivity", () => {
    it("should return recent submitted reports", async () => {
      vi.mocked(prisma.report.findMany).mockResolvedValue([
        {
          id: "report-1",
          weekStartDate: new Date("2026-07-06"),
          weekEndDate: new Date("2026-07-10"),
          submittedAt: new Date(),
          user: { id: "user-1", name: "Alice" },
          project: { id: "proj-1", name: "Frontend" },
        },
      ]);

      const result = await dashboardService.getRecentActivity(5);

      expect(prisma.report.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: "SUBMITTED" },
          orderBy: { submittedAt: "desc" },
          take: 5,
        })
      );
      expect(result).toHaveLength(1);
      expect(result[0].user.name).toBe("Alice");
    });
  });

  describe("getTasksByProject", () => {
    it("should return task counts by project", async () => {
      vi.mocked(prisma.project.findMany).mockResolvedValue([
        {
          id: "proj-1",
          name: "Frontend",
          reports: [
            { tasksCompleted: "Task 1\nTask 2" },
            { tasksCompleted: "Task 3" },
            { tasksCompleted: "" },
          ],
        },
      ]);

      const result = await dashboardService.getTasksByProject();

      expect(result).toHaveLength(1);
      expect(result[0].projectName).toBe("Frontend");
      expect(result[0].taskCount).toBe(2);
    });
  });
});
