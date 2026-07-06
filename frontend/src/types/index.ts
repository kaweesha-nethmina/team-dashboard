export interface User {
  id: string
  name: string
  email: string
  role: "MEMBER" | "MANAGER"
  createdAt?: string
}

export interface Project {
  id: string
  name: string
  description: string | null
  createdBy?: { id: string; name: string }
  createdById?: string
  createdAt: string
  _count?: { reports: number }
}

export interface Report {
  id: string
  userId: string
  projectId: string
  weekStartDate: string
  weekEndDate: string
  tasksCompleted: string
  tasksPlanned: string
  blockers: string
  hoursWorked: number | null
  notes: string | null
  status: "DRAFT" | "SUBMITTED" | "LATE"
  submittedAt: string | null
  createdAt: string
  updatedAt: string
  user?: { id: string; name: string; email: string }
  project: { id: string; name: string }
}

export interface DashboardSummary {
  totalMembers: number
  totalReports: number
  submittedReports: number
  draftReports: number
  lateReports: number
  openBlockers: number
  totalProjects: number
  complianceRate: number
}

export interface Trend {
  week: string
  submitted: number
  draft: number
  late: number
  totalHours: number
  totalTasks: number
}

export interface Workload {
  projectId: string
  projectName: string
  reportCount: number
  totalHours: number
}

export interface MemberStatus {
  userId: string
  name: string
  email: string
  totalReports: number
  submitted: number
  draft: number
  late: number
}

export interface RecentActivity {
  id: string
  weekStartDate: string
  weekEndDate: string
  submittedAt: string
  user: { id: string; name: string }
  project: { id: string; name: string }
}
