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

export class DashboardService {
  async getSummary() {
    const { weekStart, weekEnd } = getCurrentWeekRange();
    const totalMembers = await prisma.user.count({ where: { role: "MEMBER" } });
    const totalReports = await prisma.report.count({
      where: { weekStartDate: { gte: weekStart, lte: weekEnd } },
    });
    const submittedReports = await prisma.report.count({
      where: { status: "SUBMITTED", weekStartDate: { gte: weekStart, lte: weekEnd } },
    });
    const draftReports = await prisma.report.count({
      where: { status: "DRAFT", weekStartDate: { gte: weekStart, lte: weekEnd } },
    });
    const lateReports = await prisma.report.count({
      where: { status: "LATE", weekStartDate: { gte: weekStart, lte: weekEnd } },
    });

    const { data: allReports } = await supabase
      .from("reports")
      .select("blockers")
      .gte("weekStartDate", weekStart.toISOString())
      .lte("weekStartDate", weekEnd.toISOString());
    const openBlockers = (allReports || []).filter(
      (r: any) => r.blockers && r.blockers.trim().length > 0
    ).length;

    const totalProjects = await prisma.project.count();
    const complianceRate = totalReports > 0
      ? Math.round((submittedReports / totalReports) * 100)
      : 0;

    return {
      totalMembers, totalReports, submittedReports, draftReports, lateReports,
      openBlockers, totalProjects, complianceRate,
    };
  }

  async getTrends() {
    const { data: reports, error } = await supabase
      .from("reports")
      .select("weekStartDate, status, hoursWorked")
      .order("weekStartDate", { ascending: true });

    if (error || !reports) return [];

    const trendsMap = new Map<string, { week: string; submitted: number; draft: number; late: number; totalHours: number; totalTasks: number }>();

    for (const r of reports) {
      const weekKey = new Date(r.weekStartDate).toISOString().slice(0, 10);
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
    const { weekStart, weekEnd } = getCurrentWeekRange();
    const { data: projects } = await supabase.from("projects").select("id, name");
    const { data: reports } = await supabase
      .from("reports")
      .select("projectId, hoursWorked")
      .gte("weekStartDate", weekStart.toISOString())
      .lte("weekStartDate", weekEnd.toISOString());

    return (projects || []).map((p: any) => {
      const projectReports = (reports || []).filter((r: any) => r.projectId === p.id);
      return {
        projectId: p.id,
        projectName: p.name,
        reportCount: projectReports.length,
        totalHours: projectReports.reduce((sum: number, r: any) => sum + (r.hoursWorked || 0), 0),
      };
    });
  }

  async getMemberStatus() {
    const { weekStart, weekEnd } = getCurrentWeekRange();
    const { data: users } = await supabase
      .from("users")
      .select("id, name, email")
      .eq("role", "MEMBER");

    const { data: reports } = await supabase
      .from("reports")
      .select("userId, status")
      .gte("weekStartDate", weekStart.toISOString())
      .lte("weekStartDate", weekEnd.toISOString());

    return (users || []).map((u: any) => {
      const userReports = (reports || []).filter((r: any) => r.userId === u.id);
      return {
        userId: u.id,
        name: u.name,
        email: u.email,
        totalReports: userReports.length,
        submitted: userReports.filter((r: any) => r.status === "SUBMITTED").length,
        draft: userReports.filter((r: any) => r.status === "DRAFT").length,
        late: userReports.filter((r: any) => r.status === "LATE").length,
      };
    });
  }

  async getRecentActivity(limit: number = 10) {
    return prisma.report.findMany({
      where: { status: "SUBMITTED" },
      orderBy: { submittedAt: "desc" },
      take: limit,
      select: {
        id: true, weekStartDate: true, weekEndDate: true, submittedAt: true,
        userId: true, projectId: true,
      },
      include: {
        user: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
      },
    });
  }

  async getTasksByProject() {
    const { weekStart, weekEnd } = getCurrentWeekRange();
    const { data: projects } = await supabase.from("projects").select("id, name");
    const { data: reports } = await supabase
      .from("reports")
      .select("projectId, tasksCompleted")
      .gte("weekStartDate", weekStart.toISOString())
      .lte("weekStartDate", weekEnd.toISOString());

    return (projects || []).map((p: any) => ({
      projectId: p.id,
      projectName: p.name,
      taskCount: (reports || []).filter(
        (r: any) => r.projectId === p.id && r.tasksCompleted && r.tasksCompleted.trim().length > 0
      ).length,
    }));
  }
}

export const dashboardService = new DashboardService();
