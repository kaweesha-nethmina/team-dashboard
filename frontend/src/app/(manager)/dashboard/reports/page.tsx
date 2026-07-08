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
import { X, Filter, ClipboardList, Calendar } from "lucide-react"
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
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            <ClipboardList className="h-7 w-7 text-emerald-700 dark:text-emerald-500" /> Team Reports
          </h1>
          <p className="text-sm text-muted-foreground font-medium mt-1">Review, filter, and track weekly report logs from all team members</p>
        </div>
      </div>

      {/* Filter Control Board */}
      <Card className="border-border shadow-sm bg-card rounded-2xl overflow-hidden">
        <CardContent className="p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-emerald-750 text-emerald-700 dark:text-emerald-500">
            <Filter className="h-3.5 w-3.5" /> Filter Log Entries
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Submission Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full h-10 rounded-xl border-input focus:ring-emerald-600 bg-background">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent className="rounded-xl bg-card border-border">
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s} className="rounded-lg">{s || "All statuses"}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Project Area</label>
              <Select value={projectFilter} onValueChange={setProjectFilter}>
                <SelectTrigger className="w-full h-10 rounded-xl border-input focus:ring-emerald-600 bg-background">
                  <SelectValue placeholder="All projects" />
                </SelectTrigger>
                <SelectContent className="rounded-xl bg-card border-border">
                  <SelectItem value="" className="rounded-lg">All projects</SelectItem>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id} className="rounded-lg">{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" /> Start Date
              </label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full h-10 rounded-xl border-input bg-background text-xs" />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" /> End Date
              </label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full h-10 rounded-xl border-input bg-background text-xs" />
            </div>
          </div>

          {hasFilters && (
            <div className="pt-2 flex justify-start">
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs font-bold text-destructive hover:bg-destructive/10 rounded-lg h-8 px-3">
                <X className="h-3.5 w-3.5 mr-1" /> Clear Filter Configurations
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reports Table container */}
      <div className="w-full">
        {loading ? (
          <div className="flex justify-center py-16 bg-card rounded-2xl border border-border shadow-sm">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-16 bg-card rounded-2xl border border-border shadow-sm">
            <ClipboardList className="h-12 w-12 text-muted-foreground/30 mx-auto mb-2" />
            <h3 className="font-bold text-foreground text-base">No Reports Logged</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">
              We couldn&apos;t find any report logs with the active filter parameters.
            </p>
          </div>
        ) : (
          <ReportTable reports={reports} showUser />
        )}
      </div>
    </div>
  )
}
