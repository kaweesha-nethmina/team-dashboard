import { describe, it, expect, vi, beforeEach } from "vitest";

const mockSupabase = vi.hoisted(() => {
  const chain: any = {};
  const builder = () => {
    const r = Promise.resolve({ data: [], error: null });
    const c: any = { select: () => c, eq: () => c, in: () => c, order: () => c, limit: () => c, range: () => c, or: () => c, neq: () => c, gte: () => c, lte: () => c, single: () => r, then: r.then.bind(r) };
    Object.assign(chain, c);
    return chain;
  };
  return { from: vi.fn(() => builder()), builder };
});

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({ from: mockSupabase.from })),
}));

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

function buildChain(data?: any) {
  const result = Promise.resolve({ data: data ?? [], error: null });
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
    single: () => result,
    then: result.then.bind(result),
  };
  return chain;
}

function mockSupabaseData(data: any) {
  const chain = buildChain(data);
  mockSupabase.from.mockReturnValue(chain);
  return chain;
}

describe("DashboardService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getSummary", () => {
    it("should return summary metrics filtered to current week", async () => {
      vi.mocked(prisma.user.count).mockResolvedValue(5);
      vi.mocked(prisma.report.count)
        .mockResolvedValueOnce(3)
        .mockResolvedValueOnce(2)
        .mockResolvedValueOnce(1)
        .mockResolvedValueOnce(0);
      vi.mocked(prisma.project.count).mockResolvedValue(3);
      mockSupabaseData([{ blockers: "Blocker 1" }, { blockers: "" }]);

      const result = await dashboardService.getSummary();

      expect(result.totalMembers).toBe(5);
      expect(result.totalReports).toBe(3);
      expect(result.submittedReports).toBe(2);
      expect(result.draftReports).toBe(1);
      expect(result.lateReports).toBe(0);
      expect(result.totalProjects).toBe(3);
      expect(result.openBlockers).toBe(1);
      expect(result.complianceRate).toBe(67);
    });

    it("should handle zero reports", async () => {
      vi.mocked(prisma.user.count).mockResolvedValue(0);
      vi.mocked(prisma.report.count)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);
      vi.mocked(prisma.project.count).mockResolvedValue(0);
      mockSupabaseData([]);

      const result = await dashboardService.getSummary();

      expect(result.complianceRate).toBe(0);
      expect(result.totalReports).toBe(0);
    });
  });

  describe("getTrends", () => {
    it("should return trends grouped by week", async () => {
      mockSupabaseData([
        { weekStartDate: "2026-06-29", status: "SUBMITTED", hoursWorked: 40 },
        { weekStartDate: "2026-06-29", status: "DRAFT", hoursWorked: 35 },
        { weekStartDate: "2026-07-06", status: "SUBMITTED", hoursWorked: 40 },
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
    it("should return workload by project for current week", async () => {
      const projectsChain = buildChain([{ id: "proj-1", name: "Frontend" }, { id: "proj-2", name: "Backend" }]);
      const reportsChain = buildChain([{ projectId: "proj-1", hoursWorked: 40 }, { projectId: "proj-1", hoursWorked: 35 }]);
      mockSupabase.from.mockReturnValueOnce(projectsChain).mockReturnValueOnce(reportsChain);

      const result = await dashboardService.getWorkload();

      expect(result).toHaveLength(2);
      expect(result[0].projectName).toBe("Frontend");
      expect(result[0].reportCount).toBe(2);
      expect(result[0].totalHours).toBe(75);
      expect(result[1].projectName).toBe("Backend");
      expect(result[1].totalHours).toBe(0);
    });
  });

  describe("getMemberStatus", () => {
    it("should return status for each member for current week", async () => {
      const usersChain = buildChain([{ id: "user-1", name: "Alice", email: "alice@test.com" }, { id: "user-2", name: "Bob", email: "bob@test.com" }]);
      const reportsChain = buildChain([
        { userId: "user-1", status: "SUBMITTED" },
      ]);
      mockSupabase.from.mockReturnValueOnce(usersChain).mockReturnValueOnce(reportsChain);

      const result = await dashboardService.getMemberStatus();

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe("Alice");
      expect(result[0].totalReports).toBe(1);
      expect(result[0].submitted).toBe(1);
      expect(result[0].draft).toBe(0);
      expect(result[1].name).toBe("Bob");
      expect(result[1].submitted).toBe(0);
      expect(result[1].totalReports).toBe(0);
    });
  });

  describe("getRecentActivity", () => {
    it("should return recent submitted reports", async () => {
      vi.mocked(prisma.report.findMany).mockResolvedValue([
        {
          id: "report-1",
          weekStartDate: "2026-07-06",
          weekEndDate: "2026-07-10",
          submittedAt: "2026-07-10T12:00:00Z",
          userId: "user-1",
          projectId: "proj-1",
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
    it("should return task counts by project for current week", async () => {
      const projectsChain = buildChain([{ id: "proj-1", name: "Frontend" }]);
      const reportsChain = buildChain([
        { projectId: "proj-1", tasksCompleted: "Task 1\nTask 2" },
        { projectId: "proj-1", tasksCompleted: "" },
      ]);
      mockSupabase.from.mockReturnValueOnce(projectsChain).mockReturnValueOnce(reportsChain);

      const result = await dashboardService.getTasksByProject();

      expect(result).toHaveLength(1);
      expect(result[0].projectName).toBe("Frontend");
      expect(result[0].taskCount).toBe(1);
    });
  });
});
