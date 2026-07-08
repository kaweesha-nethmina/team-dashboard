import prisma from "../../config/prisma";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SECRET_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

function getCurrentWeekRange(): { weekStart: string; weekEnd: string } {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const monday = new Date(now);
  monday.setDate(now.getDate() - diffToMonday);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return { weekStart: monday.toISOString(), weekEnd: sunday.toISOString() };
}

export class ProjectsService {
  async getAll(userId?: string, assignedOnly = false) {
    let projectIds: string[] | undefined;

    if (assignedOnly && userId) {
      const assignments = await prisma.projectAssignment.findMany({
        where: { userId },
        select: { projectId: true },
      });
      projectIds = assignments.map((a) => a.projectId);
      if (projectIds.length === 0) return [];
    }

    const where = projectIds ? { id: { in: projectIds } } : undefined;

    const projects = await prisma.project.findMany({
      where,
      include: {
        createdBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const { weekStart, weekEnd } = getCurrentWeekRange();
    const { data: allReports } = await supabase
      .from("reports")
      .select("projectId")
      .gte("weekStartDate", weekStart)
      .lte("weekStartDate", weekEnd);
    const reportCounts: Record<string, number> = {};
    for (const r of allReports || []) {
      reportCounts[r.projectId] = (reportCounts[r.projectId] || 0) + 1;
    }

    return projects.map((p: any) => ({
      ...p,
      _count: { reports: reportCounts[p.id] || 0 },
    }));
  }

  async create(name: string, description: string | undefined, createdById: string) {
    return prisma.project.create({
      data: { name, description, createdById },
      include: { createdBy: { select: { id: true, name: true } } },
    });
  }

  async update(id: string, data: { name?: string; description?: string }) {
    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) throw new Error("Project not found");

    return prisma.project.update({
      where: { id },
      data,
      include: { createdBy: { select: { id: true, name: true } } },
    });
  }

  async delete(id: string) {
    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) throw new Error("Project not found");

    await prisma.report.deleteMany({ where: { projectId: id } });
    await prisma.projectAssignment.deleteMany({ where: { projectId: id } });
    await prisma.project.delete({ where: { id } });
    return { message: "Project deleted successfully" };
  }

  async assignUserByEmail(projectId: string, email: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error("User not found with that email");

    const existing = await prisma.projectAssignment.findMany({
      where: { projectId, userId: user.id },
    });
    if (existing.length > 0) throw new Error("User is already assigned to this project");

    return prisma.projectAssignment.create({
      data: { projectId, userId: user.id },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
  }

  async removeUser(projectId: string, userId: string) {
    await prisma.projectAssignment.deleteMany({
      where: { projectId, userId },
    });
    return { message: "User removed from project" };
  }

  async getById(id: string) {
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, name: true } },
      },
    });
    if (!project) throw new Error("Project not found");

    const { weekStart, weekEnd } = getCurrentWeekRange();
    const { count } = await supabase
      .from("reports")
      .select("*", { count: "exact", head: true })
      .eq("projectId", id)
      .gte("weekStartDate", weekStart)
      .lte("weekStartDate", weekEnd);

    return { ...project, _count: { reports: count || 0 } };
  }

  async getProjectMembers(projectId: string) {
    const assignments = await prisma.projectAssignment.findMany({
      where: { projectId },
      include: { user: { select: { id: true, name: true, email: true, role: true } } },
    });
    return assignments.map((a) => a.user);
  }
}

export const projectsService = new ProjectsService();
