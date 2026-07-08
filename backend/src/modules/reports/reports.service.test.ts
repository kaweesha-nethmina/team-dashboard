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
    report: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    user: {
      findMany: vi.fn(),
    },
  },
}));

import prisma from "../../config/prisma";
import { reportsService } from "./reports.service";

const mockProject = { id: "proj-1", name: "Frontend Redesign" };
const mockUser = { id: "user-1", name: "Test User", email: "test@example.com" };

const mockReport = {
  id: "report-1",
  userId: "user-1",
  projectId: "proj-1",
  weekStartDate: new Date("2026-06-29"),
  weekEndDate: new Date("2026-07-03"),
  tasksCompleted: "Task 1\nTask 2",
  tasksPlanned: "Task 3\nTask 4",
  blockers: "Blocker 1",
  hoursWorked: 40,
  notes: "Good week",
  status: "DRAFT",
  submittedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  project: mockProject,
};

const mockSubmittedReport = { ...mockReport, id: "report-2", status: "SUBMITTED", submittedAt: new Date() };

describe("ReportsService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getMyReports", () => {
    it("should return user's reports", async () => {
      vi.mocked(prisma.report.findMany)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([mockReport]);

      const result = await reportsService.getMyReports("user-1");

      expect(prisma.report.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: "user-1" },
          orderBy: { weekStartDate: "desc" },
        })
      );
      expect(result).toHaveLength(1);
    });

    it("should filter by projectId", async () => {
      vi.mocked(prisma.report.findMany)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([mockReport]);

      const result = await reportsService.getMyReports("user-1", undefined, undefined, "proj-1");

      expect(prisma.report.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: "user-1", projectId: "proj-1" },
        })
      );
    });

    it("should paginate results", async () => {
      vi.mocked(prisma.report.findMany)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      await reportsService.getMyReports("user-1", 2, 10);

      expect(prisma.report.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
        })
      );
    });
  });

  describe("createReport", () => {
    it("should create a report", async () => {
      vi.mocked(prisma.report.findMany).mockResolvedValue([]);
      vi.mocked(prisma.report.create).mockResolvedValue(mockReport);

      const result = await reportsService.createReport("user-1", {
        projectId: "proj-1",
        weekStartDate: "2026-06-29",
        weekEndDate: "2026-07-03",
        tasksCompleted: "Task 1\nTask 2",
        tasksPlanned: "Task 3\nTask 4",
      });

      expect(prisma.report.findMany).toHaveBeenCalled();
      expect(prisma.report.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: "user-1",
            projectId: "proj-1",
            tasksCompleted: "Task 1\nTask 2",
          }),
        })
      );
      expect(result.tasksCompleted).toBe("Task 1\nTask 2");
    });

    it("should throw when report already exists for that week", async () => {
      vi.mocked(prisma.report.findMany).mockResolvedValue([{ id: "existing-report" }]);

      await expect(reportsService.createReport("user-1", {
        projectId: "proj-1",
        weekStartDate: "2026-06-29",
        weekEndDate: "2026-07-03",
        tasksCompleted: "Task 1",
        tasksPlanned: "Task 2",
      })).rejects.toThrow("You already have a report for this week");
    });

    it("should create with optional fields", async () => {
      vi.mocked(prisma.report.findMany).mockResolvedValue([]);
      vi.mocked(prisma.report.create).mockResolvedValue(mockReport);

      await reportsService.createReport("user-1", {
        projectId: "proj-1",
        weekStartDate: "2026-06-29",
        weekEndDate: "2026-07-03",
        tasksCompleted: "Task 1",
        tasksPlanned: "Task 2",
        blockers: "Blocker",
        hoursWorked: 40,
        notes: "Notes",
      });

      expect(prisma.report.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            blockers: "Blocker",
            hoursWorked: 40,
            notes: "Notes",
          }),
        })
      );
    });
  });

  describe("updateReport", () => {
    it("should update a draft report", async () => {
      vi.mocked(prisma.report.findUnique).mockResolvedValue(mockReport);
      vi.mocked(prisma.report.update).mockResolvedValue({ ...mockReport, tasksCompleted: "Updated task" });

      const result = await reportsService.updateReport("report-1", "user-1", { tasksCompleted: "Updated task" });

      expect(prisma.report.update).toHaveBeenCalled();
      expect(result.tasksCompleted).toBe("Updated task");
    });

    it("should throw when report not found", async () => {
      vi.mocked(prisma.report.findUnique).mockResolvedValue(null);

      await expect(reportsService.updateReport("nonexistent", "user-1", {}))
        .rejects.toThrow("Report not found");
    });

    it("should throw when unauthorized", async () => {
      vi.mocked(prisma.report.findUnique).mockResolvedValue(mockReport);

      await expect(reportsService.updateReport("report-1", "other-user", {}))
        .rejects.toThrow("Not authorized to edit this report");
    });

    it("should throw when editing submitted report", async () => {
      vi.mocked(prisma.report.findUnique).mockResolvedValue(mockSubmittedReport);

      await expect(reportsService.updateReport("report-2", "user-1", {}))
        .rejects.toThrow("Cannot edit a submitted report");
    });
  });

  describe("submitReport", () => {
    it("should submit a draft report", async () => {
      vi.mocked(prisma.report.findUnique).mockResolvedValue(mockReport);
      vi.mocked(prisma.report.update).mockResolvedValue({ ...mockSubmittedReport });

      const result = await reportsService.submitReport("report-1", "user-1");

      expect(prisma.report.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "report-1" },
          data: expect.objectContaining({ status: "SUBMITTED" }),
        })
      );
      expect(result.status).toBe("SUBMITTED");
    });

    it("should throw when already submitted", async () => {
      vi.mocked(prisma.report.findUnique).mockResolvedValue(mockSubmittedReport);

      await expect(reportsService.submitReport("report-2", "user-1"))
        .rejects.toThrow("Report already submitted");
    });

    it("should throw when not the owner", async () => {
      vi.mocked(prisma.report.findUnique).mockResolvedValue(mockReport);

      await expect(reportsService.submitReport("report-1", "other-user"))
        .rejects.toThrow("Not authorized to submit this report");
    });
  });

  describe("getAllReports", () => {
    it("should return all reports with filters", async () => {
      vi.mocked(prisma.report.findMany)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([mockReport, mockSubmittedReport]);

      const result = await reportsService.getAllReports({
        projectId: "proj-1",
        status: "SUBMITTED",
        page: 1,
        limit: 10,
      });

      expect(prisma.report.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            projectId: "proj-1",
            status: "SUBMITTED",
          }),
        })
      );
      expect(result).toHaveLength(2);
    });
  });

  describe("getReportById", () => {
    it("should return a report by id", async () => {
      vi.mocked(prisma.report.findMany).mockResolvedValue([]);
      vi.mocked(prisma.report.findUnique).mockResolvedValue(mockReport);

      const result = await reportsService.getReportById("report-1");

      expect(prisma.report.findUnique).toHaveBeenCalledWith({
        where: { id: "report-1" },
        include: {
          project: { select: { id: true, name: true } },
          user: { select: { id: true, name: true, email: true } },
        },
      });
      expect(result?.id).toBe("report-1");
    });

    it("should return null when not found", async () => {
      vi.mocked(prisma.report.findMany).mockResolvedValue([]);
      vi.mocked(prisma.report.findUnique).mockResolvedValue(null);

      const result = await reportsService.getReportById("nonexistent");

      expect(result).toBeNull();
    });
  });

  describe("getSubmissionStatus", () => {
    it("should return submission status for all members", async () => {
      vi.mocked(prisma.report.findMany).mockResolvedValue([]);
      vi.mocked(prisma.user.findMany).mockResolvedValue([
        { id: "user-1", name: "Test User", email: "test@example.com" },
        { id: "user-2", name: "Another User", email: "another@example.com" },
      ]);

      const reportData = [
        { userId: "user-1", status: "SUBMITTED", weekStartDate: "2026-07-06", weekEndDate: "2026-07-12", submittedAt: new Date().toISOString() },
      ];
      const result = Promise.resolve({ data: reportData, error: null });
      const chain: any = { select: () => chain, gte: () => chain, lte: () => chain, then: result.then.bind(result) };
      mockSupabase.from.mockReturnValue(chain);

      const status = await reportsService.getSubmissionStatus();

      expect(status).toHaveLength(2);
      expect(status[0].isCompliant).toBe(true);
      expect(status[1].isCompliant).toBe(false);
    });
  });
});
