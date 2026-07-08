import prisma from "../../config/prisma";

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
    return prisma.report.create({
      data: {
        userId,
        projectId: data.projectId,
        weekStartDate: new Date(data.weekStartDate),
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
    const users = await prisma.user.findMany({
      where: { role: "MEMBER" },
      select: {
        id: true,
        name: true,
        email: true,
        reports: {
          orderBy: { weekStartDate: "desc" },
          take: 1,
          select: { status: true, weekEndDate: true, submittedAt: true },
        },
      },
    });

    return users.map((u) => ({
      userId: u.id,
      name: u.name,
      email: u.email,
      latestReport: u.reports[0] || null,
      isCompliant: u.reports[0]?.status === "SUBMITTED",
    }));
  }
}

export const reportsService = new ReportsService();
