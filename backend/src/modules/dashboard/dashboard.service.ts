import prisma from "../../config/prisma";

export class DashboardService {
  async getSummary() {
    const totalMembers = await prisma.user.count({ where: { role: "MEMBER" } });
    const totalReports = await prisma.report.count();
    const submittedReports = await prisma.report.count({ where: { status: "SUBMITTED" } });
    const draftReports = await prisma.report.count({ where: { status: "DRAFT" } });
    const lateReports = await prisma.report.count({ where: { status: "LATE" } });

    const openBlockers = await prisma.report.findMany({
      where: { blockers: { not: "" } },
      select: { blockers: true },
    });

    const totalProjects = await prisma.project.count();
    const complianceRate = totalReports > 0
      ? Math.round((submittedReports / totalReports) * 100)
      : 0;

    return {
      totalMembers, totalReports, submittedReports, draftReports, lateReports,
      openBlockers: openBlockers.filter((r) => r.blockers && r.blockers.trim().length > 0).length,
      totalProjects, complianceRate,
    };
  }

  async getTrends() {
    const reports = await prisma.report.findMany({
      select: { weekStartDate: true, status: true, hoursWorked: true },
      orderBy: { weekStartDate: "asc" },
    });

    const trendsMap = new Map<string, { week: string; submitted: number; draft: number; late: number; totalHours: number; totalTasks: number }>();

    for (const r of reports) {
      const weekKey = r.weekStartDate.toISOString().slice(0, 10);
      const entry = trendsMap.get(weekKey) || { week: weekKey, submitted: 0, draft: 0, late: 0, totalHours: 0, totalTasks: 0 };
      if (r.status === "SUBMITTED") entry.submitted++;
      else if (r.status === "DRAFT") entry.draft++;
      else if (r.status === "LATE") entry.late++;
      if (r.hoursWorked) entry.totalHours += r.hoursWorked;
      entry.totalTasks++;
      trendsMap.set(weekKey, entry);
    }

    return Array.from(trendsMap.values());
  }

  async getWorkload() {
    const projects = await prisma.project.findMany({
      select: {
        id: true, name: true,
        _count: { select: { reports: true } },
        reports: { select: { hoursWorked: true } },
      },
    });

    return projects.map((p: any) => ({
      projectId: p.id, projectName: p.name,
      reportCount: p._count.reports,
      totalHours: p.reports.reduce((sum: number, r: any) => sum + (r.hoursWorked || 0), 0),
    }));
  }

  async getMemberStatus() {
    const users = await prisma.user.findMany({
      where: { role: "MEMBER" },
      select: {
        id: true, name: true, email: true,
        reports: { select: { status: true, weekStartDate: true }, orderBy: { weekStartDate: "desc" }, take: 10 },
      },
    });

    return users.map((u: any) => ({
      userId: u.id, name: u.name, email: u.email,
      totalReports: u.reports.length,
      submitted: u.reports.filter((r: any) => r.status === "SUBMITTED").length,
      draft: u.reports.filter((r: any) => r.status === "DRAFT").length,
      late: u.reports.filter((r: any) => r.status === "LATE").length,
    }));
  }

  async getRecentActivity(limit: number = 10) {
    return prisma.report.findMany({
      where: { status: "SUBMITTED" },
      orderBy: { submittedAt: "desc" },
      take: limit,
      select: {
        id: true, weekStartDate: true, weekEndDate: true, submittedAt: true,
        user: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
      },
    });
  }

  async getTasksByProject() {
    const projects = await prisma.project.findMany({
      select: {
        id: true, name: true,
        reports: { select: { tasksCompleted: true } },
      },
    });

    return projects.map((p: any) => ({
      projectId: p.id, projectName: p.name,
      taskCount: p.reports.filter((r: any) => r.tasksCompleted && r.tasksCompleted.trim().length > 0).length,
    }));
  }
}

export const dashboardService = new DashboardService();
