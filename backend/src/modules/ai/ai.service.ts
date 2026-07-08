import prisma from "../../config/prisma";

const PROJECT_KEYWORDS = ["blocker", "task", "report", "project", "member", "hours", "submission", "compliance", "progress", "work", "sprint", "team", "status"];

function isProjectRelated(question: string): boolean {
  const q = question.toLowerCase();
  return PROJECT_KEYWORDS.some((kw) => q.includes(kw));
}

function buildContext(reports: any[]): string {
  return reports.map((r) =>
    `[${r.user?.name || "Unknown"}] Project: ${r.project?.name || "N/A"} | Week: ${r.weekStartDate?.toString().slice(0, 10) || "N/A"}-${r.weekEndDate?.toString().slice(0, 10) || "N/A"} | Status: ${r.status} | Completed: ${r.tasksCompleted || ""} | Planned: ${r.tasksPlanned || ""} | Blockers: ${r.blockers || "None"} | Hours: ${r.hoursWorked ?? "N/A"}`
  ).join("\n");
}

export class AIService {
  async askQuestion(question: string, projectId?: string) {
    const projects = await prisma.project.findMany({
      select: { id: true, name: true },
    });

    if (!projectId) {
      const mentioned = projects.find((p) =>
        question.toLowerCase().includes(p.name.toLowerCase())
      );
      if (mentioned) projectId = mentioned.id;
    }

    if (!projectId && isProjectRelated(question)) {
      return {
        answer: null,
        requiresProjectSelection: true,
        projects: projects.map((p) => ({ id: p.id, name: p.name })),
        context: "",
      };
    }

    const where: any = {};
    if (projectId) where.projectId = projectId;

    const reports = await prisma.report.findMany({
      where,
      include: {
        user: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
      },
      orderBy: { weekStartDate: "desc" },
      take: 50,
    });

    const context = buildContext(reports);
    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const { env } = await import("../../config/env");

    if (!env.geminiApiKey) {
      return { answer: "AI assistant is not configured. Set GEMINI_API_KEY in .env", requiresProjectSelection: false, projects: [], context };
    }

    const genAI = new GoogleGenerativeAI(env.geminiApiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    let projectScope = projectId
      ? `The user is asking about the specific project: "${projects.find((p) => p.id === projectId)?.name}". Only answer based on data from that project.`
      : "The user is asking about the entire team. Use all available data.";

    const prompt = `You are a team dashboard AI assistant for managers. Answer concisely and helpfully.

${projectScope}

Here is the report data:
${context || "No reports found."}

Question: ${question}

If there is no relevant data, say so clearly.`;

    let answer: string;
    try {
      const result = await model.generateContent(prompt);
      answer = result.response.text();
    } catch {
      answer = this.generateLocalAnswer(question, reports, projectId ? projects.find((p) => p.id === projectId)?.name : undefined);
    }

    return { answer, requiresProjectSelection: false, projects: [], context };
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

    const context = buildContext(reports);
    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const { env } = await import("../../config/env");

    if (!env.geminiApiKey) {
      return { summary: this.generateLocalSummary(reports), context };
    }

    const genAI = new GoogleGenerativeAI(env.geminiApiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `Generate a concise team summary report based on the following weekly reports. Highlight key accomplishments, blockers, and overall team health:\n\n${context || "No reports found."}\n\nSummary:`;

    let summary: string;
    try {
      const result = await model.generateContent(prompt);
      summary = result.response.text();
    } catch {
      summary = this.generateLocalSummary(reports);
    }

    return { summary, context };
  }

  private generateLocalAnswer(question: string, reports: any[], projectName?: string): string {
    const total = reports.length;
    const submitted = reports.filter((r: any) => r.status === "SUBMITTED").length;
    const draft = reports.filter((r: any) => r.status === "DRAFT").length;
    const late = reports.filter((r: any) => r.status === "LATE").length;
    const blocked = reports.filter((r: any) => r.blockers && r.blockers.trim().length > 0).length;
    const totalHours = reports.reduce((sum: number, r: any) => sum + (r.hoursWorked || 0), 0);
    const uniqueUsers = new Set(reports.map((r: any) => r.user?.name)).size;
    const scope = projectName ? ` for **${projectName}**` : "";

    const q = question.toLowerCase();

    if (q.includes("blocker")) {
      const blockerReports = reports.filter((r: any) => r.blockers && r.blockers.trim().length > 0);
      if (blockerReports.length === 0) return `No blockers reported${scope}.`;
      return blockerReports.map((r: any) =>
        `- **${r.user?.name || "Unknown"}**: ${r.blockers} (${r.project?.name || "N/A"})`
      ).join("\n");
    }

    if (q.includes("report") || q.includes("submission") || q.includes("compliance")) {
      return `Reports${scope}: ${total} total (${submitted} submitted, ${draft} draft, ${late} late). Compliance: ${total > 0 ? Math.round((submitted / total) * 100) : 0}%.`;
    }

    if (q.includes("hour") || q.includes("work") || q.includes("time")) {
      return `Total hours logged${scope}: ${totalHours} across ${total} reports from ${uniqueUsers} members.`;
    }

    if (q.includes("member") || q.includes("team") || q.includes("who")) {
      const names = [...new Set(reports.map((r: any) => r.user?.name).filter(Boolean))];
      return `Team members${scope}: ${names.join(", ") || "No members found."}`;
    }

    if (q.includes("task") || q.includes("done") || q.includes("complete")) {
      const taskCount = reports.reduce((sum: number, r: any) => sum + (r.tasksCompleted ? r.tasksCompleted.split("\n").length : 0), 0);
      return `Tasks completed${scope}: ${taskCount} across ${total} reports.`;
    }

    return [
      `Here's what I found${scope}:`,
      `- **${total}** reports (${submitted} submitted, ${draft} draft, ${late} late)`,
      `- **${blocked}** blocker(s) reported`,
      `- **${totalHours}** total hours logged by **${uniqueUsers}** member(s)`,
      `- Compliance rate: **${total > 0 ? Math.round((submitted / total) * 100) : 0}%**`,
    ].join("\n");
  }

  private generateLocalSummary(reports: any[]) {
    const total = reports.length;
    const submitted = reports.filter((r: any) => r.status === "SUBMITTED").length;
    const blocked = reports.filter((r: any) => r.blockers && r.blockers.trim().length > 0).length;
    const uniqueUsers = new Set(reports.map((r: any) => r.user?.name)).size;
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
