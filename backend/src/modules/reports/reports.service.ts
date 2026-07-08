import prisma from "../../config/prisma";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SECRET_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

function getCurrentWeekRange(): { weekStart: Date; weekEnd: Date } {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const monday = new Date(now);
  monday.setDate(now.getDate() - diffToMonday);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  return { weekStart: monday, weekEnd: sunday };
}

export class ReportsService {
  private async markLateReports(): Promise<void> {
    const now = new Date();
    const lateReports = await prisma.report.findMany({
      where: { status: "DRAFT", weekEndDate: { lt: now } },
      select: { id: true },
    });
    for (const r of lateReports) {
      await prisma.report.update({
        where: { id: r.id },
        data: { status: "LATE" },
      });
    }
  }

  async getMyReports(userId: string, page?: number, limit?: number, projectId?: string) {
    await this.markLateReports();
    const take = limit || 50;
    const skip = page && page > 1 ? (page - 1) * take : 0;
    const where: any = { userId };
    if (projectId) where.projectId = projectId;
    return prisma.report.findMany({
      where,
      include: { project: { select: { id: true, name: true } } },
      orderBy: { weekStartDate: "desc" },
      take,
      skip,
    });
  }

  async createReport(userId: string, data: {
    projectId: string;
    weekStartDate: string;
    weekEndDate: string;
    tasksCompleted: string;
    tasksPlanned: string;
    blockers?: string;
    hoursWorked?: number;
    notes?: string;
  }) {
    const weekStart = new Date(data.weekStartDate);
    weekStart.setHours(0, 0, 0, 0);

    const existing = await prisma.report.findMany({
      where: { userId, weekStartDate: { gte: weekStart, lt: new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000) } },
      select: { id: true },
    });

    if (existing.length > 0) {
      throw new Error("You already have a report for this week. Edit the existing report instead.");
    }

    return prisma.report.create({
      data: {
        userId,
        projectId: data.projectId,
        weekStartDate: weekStart,
        weekEndDate: new Date(data.weekEndDate),
        tasksCompleted: data.tasksCompleted,
        tasksPlanned: data.tasksPlanned,
        blockers: data.blockers || "",
        hoursWorked: data.hoursWorked || null,
        notes: data.notes || null,
      },
      include: { project: { select: { id: true, name: true } } },
    });
  }

  async updateReport(reportId: string, userId: string, data: any) {
    const report = await prisma.report.findUnique({ where: { id: reportId } });
    if (!report) throw new Error("Report not found");
    if (report.userId !== userId) throw new Error("Not authorized to edit this report");
    if (report.status === "SUBMITTED") throw new Error("Cannot edit a submitted report");

    return prisma.report.update({
      where: { id: reportId },
      data: {
        ...data,
        weekStartDate: data.weekStartDate ? new Date(data.weekStartDate) : undefined,
        weekEndDate: data.weekEndDate ? new Date(data.weekEndDate) : undefined,
      },
      include: { project: { select: { id: true, name: true } } },
    });
  }

  async submitReport(reportId: string, userId: string) {
    const report = await prisma.report.findUnique({ where: { id: reportId } });
    if (!report) throw new Error("Report not found");
    if (report.userId !== userId) throw new Error("Not authorized to submit this report");
    if (report.status === "SUBMITTED") throw new Error("Report already submitted");

    return prisma.report.update({
      where: { id: reportId },
      data: { status: "SUBMITTED", submittedAt: new Date() },
      include: { project: { select: { id: true, name: true } }, user: { select: { id: true, name: true, email: true } } },
    });
  }

  async getAllReports(filters: {
    userId?: string;
    projectId?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) {
    await this.markLateReports();
    const where: any = {};

    if (filters.userId) where.userId = filters.userId;
    if (filters.projectId) where.projectId = filters.projectId;
    if (filters.status) where.status = filters.status;
    if (filters.startDate) where.weekStartDate = { ...where.weekStartDate, gte: new Date(filters.startDate) };
    if (filters.endDate) where.weekEndDate = { ...where.weekEndDate, lte: new Date(filters.endDate) };

    const take = filters.limit || 50;
    const skip = filters.page && filters.page > 1 ? (filters.page - 1) * take : 0;

    return prisma.report.findMany({
      where,
      include: {
        project: { select: { id: true, name: true } },
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { weekStartDate: "desc" },
      take,
      skip,
    });
  }

  async getReportById(reportId: string) {
    await this.markLateReports();
    return prisma.report.findUnique({
      where: { id: reportId },
      include: {
        project: { select: { id: true, name: true } },
        user: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async getSubmissionStatus() {
    await this.markLateReports();
    const { weekStart, weekEnd } = getCurrentWeekRange();

    const { data: reports } = await supabase
      .from("reports")
      .select("userId, status, weekStartDate, weekEndDate, submittedAt")
      .gte("weekStartDate", weekStart.toISOString())
      .lte("weekStartDate", weekEnd.toISOString());

    const users = await prisma.user.findMany({
      where: { role: "MEMBER" },
      select: { id: true, name: true, email: true },
    });

    return users.map((u) => {
      const weekReport = (reports || []).find((r: any) => r.userId === u.id);
      return {
        userId: u.id,
        name: u.name,
        email: u.email,
        latestReport: weekReport || null,
        isCompliant: weekReport?.status === "SUBMITTED",
      };
    });
  }
}

export const reportsService = new ReportsService();
