import { PrismaClient, Role, ReportStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  const passwordHash = await bcrypt.hash("password123", 12);

  const manager = await prisma.user.upsert({
    where: { email: "manager@teamdash.com" },
    update: {},
    create: {
      name: "Alice Manager",
      email: "manager@teamdash.com",
      passwordHash,
      role: Role.MANAGER,
    },
  });

  const members = [];
  const memberNames = [
    "Bob Developer",
    "Carol Designer",
    "Dave Engineer",
    "Eve Tester",
  ];

  for (const name of memberNames) {
    const email = `${name.toLowerCase().replace(/\s+/g, ".")}@teamdash.com`;
    const member = await prisma.user.upsert({
      where: { email },
      update: {},
      create: { name, email, passwordHash, role: Role.MEMBER },
    });
    members.push(member);
  }

  const projects = [];
  const projectData = [
    { name: "Frontend App", description: "React-based customer dashboard" },
    { name: "API Gateway", description: "Backend API service layer" },
    { name: "Mobile App", description: "iOS and Android applications" },
    { name: "Design System", description: "Shared UI component library" },
  ];

  for (const p of projectData) {
    const project = await prisma.project.upsert({
      where: { id: `seed-${p.name.toLowerCase().replace(/\s+/g, "-")}` },
      update: {},
      create: {
        id: `seed-${p.name.toLowerCase().replace(/\s+/g, "-")}`,
        name: p.name,
        description: p.description,
        createdById: manager.id,
      },
    });
    projects.push(project);
  }

  for (const member of members) {
    for (const project of projects.slice(0, 2)) {
      await prisma.projectAssignment.upsert({
        where: { userId_projectId: { userId: member.id, projectId: project.id } },
        update: {},
        create: { userId: member.id, projectId: project.id },
      });
    }
  }

  const weekStarts = [
    new Date("2026-06-22"),
    new Date("2026-06-15"),
    new Date("2026-06-08"),
  ];

  let reportCount = 0;
  for (const member of members) {
    for (let wi = 0; wi < weekStarts.length; wi++) {
      const ws = weekStarts[wi];
      const we = new Date(ws);
      we.setDate(we.getDate() + 6);

      const project = projects[wi % projects.length];
      const isSubmitted = wi < 2;
      const isLate = wi === 2 && member.name === "Eve Tester";

      await prisma.report.create({
        data: {
          userId: member.id,
          projectId: project.id,
          weekStartDate: ws,
          weekEndDate: we,
          tasksCompleted: `Completed feature implementation for ${project.name}\n- Fixed 3 critical bugs\n- Code review for team PRs`,
          tasksPlanned: `Continue work on ${project.name}\n- Write unit tests\n- Performance optimization`,
          blockers: wi === 2 && member.name === "Bob Developer" ? "Waiting for API endpoint from backend team" : "",
          hoursWorked: 32 + Math.floor(Math.random() * 15),
          notes: "Good progress this week",
          status: isLate ? ReportStatus.LATE : isSubmitted ? ReportStatus.SUBMITTED : ReportStatus.DRAFT,
          submittedAt: isSubmitted ? new Date(we.getTime() + 3600000) : null,
        },
      });
      reportCount++;
    }
  }

  console.log(`Seeded:`);
  console.log(`  - ${1 + members.length} users (1 manager, ${members.length} members)`);
  console.log(`  - ${projects.length} projects`);
  console.log(`  - ${reportCount} reports`);
  console.log(`\nLogin credentials:`);
  console.log(`  Manager: manager@teamdash.com / password123`);
  console.log(`  Members: bob.developer@teamdash.com (and others) / password123`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
