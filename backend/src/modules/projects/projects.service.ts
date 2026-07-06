import prisma from "../../config/prisma";

export class ProjectsService {
  async getAll() {
    return prisma.project.findMany({
      include: {
        createdBy: { select: { id: true, name: true } },
        _count: { select: { reports: true } },
      },
      orderBy: { createdAt: "desc" },
    });
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

  async assignUser(projectId: string, userId: string) {
    return prisma.projectAssignment.create({
      data: { projectId, userId },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
  }

  async removeUser(projectId: string, userId: string) {
    await prisma.projectAssignment.deleteMany({
      where: { projectId, userId },
    });
    return { message: "User removed from project" };
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
