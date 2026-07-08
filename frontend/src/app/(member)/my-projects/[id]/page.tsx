"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/hooks/useAuth"
import { api } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, FolderKanban, FileText, Plus, Pencil, Calendar } from "lucide-react"
import type { Project, Report } from "@/types"

function getCurrentWeekRange(): { weekStart: string; weekEnd: string } {
  const now = new Date()
  const dayOfWeek = now.getDay()
  const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
  const monday = new Date(now)
  monday.setDate(now.getDate() - diffToMonday)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  return {
    weekStart: monday.toISOString().slice(0, 10),
    weekEnd: sunday.toISOString().slice(0, 10),
  }
}

export default function MemberProjectDetailPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const [project, setProject] = useState<Project | null>(null)
  const [reports, setReports] = useState<Report[]>([])
  const [, setLoading] = useState(true)
  const { weekStart } = getCurrentWeekRange()

  useEffect(() => {
    if (authLoading) return
    if (!user) { router.push("/login"); return }
    if (user.role === "MANAGER") { router.push("/dashboard"); return }
    loadData()
  }, [user, authLoading])

  if (authLoading) {
    return <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>
  }

  const loadData = async () => {
    try {
      const id = params.id as string
      const [projectData, reportsData] = await Promise.all([
        api.projects.getById(id),
        api.reports.getMyReports({ projectId: id }),
      ])
      setProject(projectData)
      setReports(reportsData)
    } catch (err) {
      console.error("Failed to load project:", err)
      router.push("/my-projects")
    } finally {
      setLoading(false)
    }
  }

  if (!project) return null

  // Filter reports to current week for summary counts
  const weekReports = reports.filter((r) =>
    r.weekStartDate?.slice(0, 10) === weekStart
  )
  const submitted = weekReports.filter((r) => r.status === "SUBMITTED").length
  const draft = weekReports.filter((r) => r.status === "DRAFT").length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/my-projects"><ArrowLeft className="h-5 w-5" /></Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <FolderKanban className="h-5 w-5 text-muted-foreground" />
              <h1 className="text-3xl font-bold">{project.name}</h1>
            </div>
            {project.description && <p className="text-muted-foreground mt-1">{project.description}</p>}
          </div>
        </div>
        {(() => {
          const weekDraft = weekReports.find((r) => r.status === "DRAFT")
          const weekSubmitted = weekReports.find((r) => r.status === "SUBMITTED")
          const editId = weekDraft?.id || weekSubmitted?.id
          return editId ? (
            <Button asChild>
              <Link href={`/my-reports/${editId}/edit`}>
                <Pencil className="h-4 w-4 mr-2" /> {weekSubmitted ? "View This Week" : "Edit This Week"}
              </Link>
            </Button>
          ) : (
            <Button asChild>
              <Link href={`/my-reports/new?projectId=${project.id}`}>
                <Plus className="h-4 w-4 mr-2" /> New Report
              </Link>
            </Button>
          )
        })()}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">This Week Reports</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{weekReports.length}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Submitted</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-green-600">{submitted}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Drafts</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-yellow-600">{draft}</p></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-4 w-4" /> My Reports
          </CardTitle>
        </CardHeader>
        <CardContent>
          {reports.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No reports yet for this project</p>
              <Button asChild>
                <Link href={`/my-reports/new?projectId=${project.id}`}>
                  <Plus className="h-4 w-4 mr-2" /> Create Your First Report
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {reports.map((r) => (
                <Link key={r.id} href={r.status === "DRAFT" ? `/my-reports/${r.id}/edit` : `/reports/${r.id}`}>
                  <div className="flex items-center justify-between rounded-lg border px-4 py-3 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">
                          {new Date(r.weekStartDate).toLocaleDateString()} - {new Date(r.weekEndDate).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-muted-foreground">{r.hoursWorked || 0} hrs logged</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={r.status === "SUBMITTED" ? "success" : "warning"} className="text-xs">
                        {r.status === "SUBMITTED" ? "Submitted" : "Draft"}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {r.status === "SUBMITTED" ? "Click to view" : "Click to edit"}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
