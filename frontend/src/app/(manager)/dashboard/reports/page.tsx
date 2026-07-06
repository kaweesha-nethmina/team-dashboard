"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { api } from "@/lib/api"
import { ReportTable } from "@/components/reports/ReportTable"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { X } from "lucide-react"
import type { Report, Project } from "@/types"

const STATUSES = ["", "DRAFT", "SUBMITTED", "LATE"] as const

export default function TeamReportsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [reports, setReports] = useState<Report[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState("")
  const [projectFilter, setProjectFilter] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  const loadReports = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, string> = {}
      if (statusFilter) params.status = statusFilter
      if (projectFilter) params.projectId = projectFilter
      if (startDate) params.startDate = startDate
      if (endDate) params.endDate = endDate
      const data = await api.reports.getAll(Object.keys(params).length > 0 ? params : undefined)
      setReports(data)
    } catch (err) {
      console.error("Failed to load reports:", err)
    } finally {
      setLoading(false)
    }
  }, [statusFilter, projectFilter, startDate, endDate])

  useEffect(() => {
    if (authLoading) return
    if (!user) { router.push("/login"); return }
    if (user.role === "MEMBER") { router.push("/my-reports"); return }
    loadReports()
    api.projects.getAll().then(setProjects).catch(console.error)
  }, [user, authLoading])

  useEffect(() => {
    loadReports()
  }, [loadReports])

  const clearFilters = () => {
    setStatusFilter("")
    setProjectFilter("")
    setStartDate("")
    setEndDate("")
  }

  const hasFilters = statusFilter || projectFilter || startDate || endDate

  if (authLoading) {
    return <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Team Reports</h1>
        <p className="text-muted-foreground">View and filter all member reports</p>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Status</label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32"><SelectValue placeholder="All statuses" /></SelectTrigger>
            <SelectContent>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s}>{s || "All statuses"}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Project</label>
          <Select value={projectFilter} onValueChange={setProjectFilter}>
            <SelectTrigger className="w-40"><SelectValue placeholder="All projects" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">All projects</SelectItem>
              {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">From</label>
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-36" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">To</label>
          <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-36" />
        </div>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="h-4 w-4 mr-1" /> Clear
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : reports.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">No reports found</p>
          ) : (
            <ReportTable reports={reports} showUser />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
