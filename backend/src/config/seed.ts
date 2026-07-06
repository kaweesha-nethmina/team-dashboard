import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

async function seed() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error("SUPABASE_URL and SUPABASE_SECRET_KEY must be set");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const passwordHash = await bcrypt.hash("password123", 12);

  // Clear existing data (order matters for FK constraints)
  for (const table of ["reports", "project_assignments", "projects", "users"]) {
    const { error } = await supabase.from(table).delete().neq("id", "00000000-0000-0000-0000-000000000000");
    if (error) console.warn(`Could not clear ${table}:`, error.message);
  }

  // Seed users
  const { data: manager } = await supabase.from("users").insert({
    name: "Alice Manager",
    email: "manager@teamdash.com",
    passwordHash,
    role: "MANAGER",
  }).select("id").single();

  const { data: member1 } = await supabase.from("users").insert({
    name: "Bob Member",
    email: "member@teamdash.com",
    passwordHash,
    role: "MEMBER",
  }).select("id").single();

  const { data: member2 } = await supabase.from("users").insert({
    name: "Carol Developer",
    email: "carol@teamdash.com",
    passwordHash,
    role: "MEMBER",
  }).select("id").single();

  const { data: member3 } = await supabase.from("users").insert({
    name: "Dave Designer",
    email: "dave@teamdash.com",
    passwordHash,
    role: "MEMBER",
  }).select("id").single();

  if (!manager || !member1 || !member2 || !member3) {
    console.error("Failed to seed users");
    process.exit(1);
  }

  console.log("Seeded 4 users");

  // Seed projects
  const { data: project1 } = await supabase.from("projects").insert({
    name: "Frontend Redesign",
    description: "Redesign the main dashboard UI with Tailwind and shadcn",
    createdById: manager.id,
  }).select("id").single();

  const { data: project2 } = await supabase.from("projects").insert({
    name: "API Performance",
    description: "Optimize API response times and add caching layer",
    createdById: manager.id,
  }).select("id").single();

  const { data: project3 } = await supabase.from("projects").insert({
    name: "Mobile App",
    description: "Build React Native companion app for report approvals",
    createdById: manager.id,
  }).select("id").single();

  if (!project1 || !project2 || !project3) {
    console.error("Failed to seed projects");
    process.exit(1);
  }

  console.log("Seeded 3 projects");

  // Assign members to projects
  await supabase.from("project_assignments").insert([
    { userId: member1.id, projectId: project1.id },
    { userId: member2.id, projectId: project1.id },
    { userId: member3.id, projectId: project2.id },
    { userId: member1.id, projectId: project3.id },
    { userId: member2.id, projectId: project2.id },
    { userId: member3.id, projectId: project3.id },
  ]);

  console.log("Seeded project assignments");

  // Seed reports — 3 weeks of data for each member
  const now = new Date();
  const weekDates: { start: Date; end: Date }[] = [];
  for (let w = 0; w < 3; w++) {
    const monday = new Date(now);
    monday.setDate(now.getDate() - now.getDay() + 1 - w * 7);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    weekDates.push({ start: monday, end: sunday });
  }

  const members = [
    { id: member1.id, name: "Bob" },
    { id: member2.id, name: "Carol" },
    { id: member3.id, name: "Dave" },
  ];

  const projectIds = [project1.id, project2.id, project3.id];

  for (const member of members) {
    for (let wi = 0; wi < weekDates.length; wi++) {
      const { start, end } = weekDates[wi];
      const isSubmitted = wi < 2; // last week is draft
      const reportData = {
        userId: member.id,
        projectId: projectIds[Math.floor(Math.random() * projectIds.length)],
        weekStartDate: start.toISOString().slice(0, 10),
        weekEndDate: end.toISOString().slice(0, 10),
        tasksCompleted: `- Implemented ${member.name}'s feature set for the week\n- Reviewed PRs from teammates\n- Updated documentation for new endpoints`,
        tasksPlanned: `- Start on the next sprint backlog items\n- Refactor legacy code in the reporting module\n- Set up integration tests`,
        blockers: wi === 1 ? "Awaiting design approval for the new component library" : "",
        hoursWorked: 35 + Math.floor(Math.random() * 10),
        notes: wi === 0 ? "Productive week, hit all targets." : "",
        status: isSubmitted ? "SUBMITTED" : "DRAFT",
        submittedAt: isSubmitted ? new Date(end.getTime() + 3600000).toISOString() : null,
      };
      await supabase.from("reports").insert(reportData);
    }
  }

  console.log("Seeded 9 reports (3 members × 3 weeks)");
  console.log("\nSeed complete!");
  console.log("Credentials:");
  console.log("  Manager: manager@teamdash.com / password123");
  console.log("  Members: member@teamdash.com / password123");
  console.log("           carol@teamdash.com / password123");
  console.log("           dave@teamdash.com / password123");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
