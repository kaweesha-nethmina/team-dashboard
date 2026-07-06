import prisma from "../../config/prisma";

export class AIService {
  async askQuestion(question: string) {
    const reports = await prisma.report.findMany({
      include: {
        user: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
      },
      orderBy: { weekStartDate: "desc" },
      take: 50,
    });

    const context = reports.map((r) =>
      `[${r.user.name}] Project: ${r.project.name} | Week: ${r.weekStartDate.toISOString().slice(0, 10)}-${r.weekEndDate.toISOString().slice(0, 10)} | Status: ${r.status} | Completed: ${r.tasksCompleted} | Planned: ${r.tasksPlanned} | Blockers: ${r.blockers} | Hours: ${r.hoursWorked || "N/A"}`
    ).join("\n");

    const prompt = `You are a team dashboard AI assistant. Answer the manager's question based on the following weekly reports data:\n\n${context}\n\nQuestion: ${question}\n\nProvide a concise, helpful answer.`;

    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    const { env } = await import("../../config/env");

    if (!env.anthropicApiKey) {
      return { answer: "AI assistant is not configured. Please set ANTHROPIC_API_KEY in your environment variables.", context };
    }

    const anthropic = new Anthropic({ apiKey: env.anthropicApiKey });
    const response = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }],
    });

    const answer = response.content[0].type === "text" ? response.content[0].text : "Unable to generate answer";
    return { answer, context };
  }

  async generateSummary(projectId?: string, startDate?: string, endDate?: string) {
    const where: any = {};
    if (projectId) where.projectId = projectId;
    if (startDate) where.weekStartDate = { gte: new Date(startDate) };
    if (endDate) where.weekEndDate = { lte: new Date(endDate) };

    const reports = await prisma.report.findMany({
      where,
      include: {
        user: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
      },
      orderBy: { weekStartDate: "desc" },
    });

    const context = reports.map((r) =>
      `[${r.user.name}] Project: ${r.project.name} | Week: ${r.weekStartDate.toISOString().slice(0, 10)}-${r.weekEndDate.toISOString().slice(0, 10)} | Status: ${r.status} | Completed: ${r.tasksCompleted} | Planned: ${r.tasksPlanned} | Blockers: ${r.blockers} | Hours: ${r.hoursWorked || "N/A"}`
    ).join("\n");

    const prompt = `Generate a concise team summary report based on the following weekly reports. Highlight key accomplishments, blockers, and overall team health:\n\n${context}\n\nSummary:`;

    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    const { env } = await import("../../config/env");

    if (!env.anthropicApiKey) {
      return { summary: this.generateLocalSummary(reports), context };
    }

    const anthropic = new Anthropic({ apiKey: env.anthropicApiKey });
    const response = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 1500,
      messages: [{ role: "user", content: prompt }],
    });

    const summary = response.content[0].type === "text" ? response.content[0].text : "Unable to generate summary";
    return { summary, context };
  }

  private generateLocalSummary(reports: any[]) {
    const total = reports.length;
    const submitted = reports.filter((r: any) => r.status === "SUBMITTED").length;
    const blocked = reports.filter((r: any) => r.blockers && r.blockers.trim().length > 0).length;
    const uniqueUsers = new Set(reports.map((r: any) => r.user.name)).size;
    const totalHours = reports.reduce((sum: number, r: any) => sum + (r.hoursWorked || 0), 0);

    return [
      `Team Summary (${total} reports from ${uniqueUsers} members)`,
      `Submitted: ${submitted}/${total}`,
      `Compliance: ${total > 0 ? Math.round((submitted / total) * 100) : 0}%`,
      `Open Blockers: ${blocked}`,
      `Total Hours Logged: ${totalHours}`,
      blocked > 0 ? `Action needed: ${blocked} report(s) have blockers that may need attention.` : "",
    ].filter(Boolean).join("\n");
  }
}

export const aiService = new AIService();
