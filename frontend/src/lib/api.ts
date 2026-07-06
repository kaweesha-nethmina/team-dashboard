/* eslint-disable @typescript-eslint/no-explicit-any */
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_URL}${endpoint}`

  const config: RequestInit = {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  }

  const res = await fetch(url, config)

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Request failed" }))
    throw new Error(error.error || `HTTP ${res.status}`)
  }

  return res.json()
}

export const api = {
  auth: {
    members: (search?: string) =>
      request<any[]>(`/auth/members${search ? `?search=${encodeURIComponent(search)}` : ""}`),
    register: (data: { name: string; email: string; password: string; role?: string }) =>
      request<any>("/auth/register", { method: "POST", body: JSON.stringify(data) }),
    login: (data: { email: string; password: string }) =>
      request<any>("/auth/login", { method: "POST", body: JSON.stringify(data) }),
    logout: () => request<any>("/auth/logout", { method: "POST" }),
    me: () => request<any>("/auth/me"),
  },
  reports: {
    getMyReports: () => request<any[]>("/reports/me"),
    create: (data: any) =>
      request<any>("/reports", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: any) =>
      request<any>(`/reports/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    submit: (id: string) =>
      request<any>(`/reports/${id}/submit`, { method: "POST" }),
    getAll: (params?: Record<string, string>) => {
      const query = params ? "?" + new URLSearchParams(params).toString() : ""
      return request<any[]>(`/reports${query}`)
    },
    getById: (id: string) => request<any>(`/reports/${id}`),
    getStatus: () => request<any[]>("/reports/status"),
  },
  projects: {
    getAll: () => request<any[]>("/projects"),
    create: (data: { name: string; description?: string }) =>
      request<any>("/projects", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: any) =>
      request<any>(`/projects/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: string) =>
      request<any>(`/projects/${id}`, { method: "DELETE" }),
    assignUser: (projectId: string, email: string) =>
      request<any>(`/projects/${projectId}/assign`, { method: "POST", body: JSON.stringify({ email }) }),
    removeUser: (projectId: string, userId: string) =>
      request<any>(`/projects/${projectId}/assign/${userId}`, { method: "DELETE" }),
    getMembers: (projectId: string) => request<any[]>(`/projects/${projectId}/members`),
  },
  dashboard: {
    getSummary: () => request<any>("/dashboard/summary"),
    getTrends: () => request<any[]>("/dashboard/trends"),
    getWorkload: () => request<any[]>("/dashboard/workload"),
    getMemberStatus: () => request<any[]>("/dashboard/member-status"),
    getRecentActivity: (limit?: number) =>
      request<any[]>(`/dashboard/recent-activity${limit ? `?limit=${limit}` : ""}`),
    getTasksByProject: () => request<any[]>("/dashboard/tasks-by-project"),
  },
  ai: {
    ask: (question: string) =>
      request<{ answer: string; context: string }>("/ai/ask", { method: "POST", body: JSON.stringify({ question }) }),
    summary: (params?: { projectId?: string; startDate?: string; endDate?: string }) => {
      const query = params ? "?" + new URLSearchParams(params as any).toString() : ""
      return request<{ summary: string; context: string }>(`/ai/summary${query}`)
    },
  },
}
