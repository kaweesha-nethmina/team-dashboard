"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/hooks/useAuth"
import { api } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ReportTable } from "@/components/reports/ReportTable"
import { ArrowLeft, FolderKanban, Users, Calendar, FileText } from "lucide-react"
import type { Project, Report, User } from "@/types"

export default function ProjectDetailPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const [project, setProject] = useState<Project | null>(null)
  const [members, setMembers] = useState<User[]>([])
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return
    if (!user) { router.push("/login"); return }
    if (user.role === "MEMBER") { router.push("/my-reports"); return }
    loadData()
  }, [user, authLoading])

  const loadData = async () => {
    try {
      const id = params.id as string
      const [projectData, membersData, reportsData] = await Promise.all([
        api.projects.getById(id),
        api.projects.getMembers(id),
        api.reports.getAll({ projectId: id }),
      ])
      setProject(projectData)
      setMembers(membersData)
      setReports(reportsData)
    } catch (err) {
      console.error("Failed to load project:", err)
      router.push("/dashboard/projects")
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>
  }

  if (!project) return null

  const submitted = reports.filter((r) => r.status === "SUBMITTED").length
  const draft = reports.filter((r) => r.status === "DRAFT").length

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/projects"><ArrowLeft className="h-5 w-5" /></Link>
        </Button>
        <div>
          <div className="flex items-center gap-2">
            <FolderKanban className="h-5 w-5 text-muted-foreground" />
            <h1 className="text-3xl font-bold">{project.name}</h1>
          </div>
          {project.description && <p className="text-muted-foreground mt-1">{project.description}</p>}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Members</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{members.length}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Reports</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{reports.length}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Submitted</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-green-600">{submitted}<span className="text-sm text-muted-foreground font-normal"> / {reports.length}</span></p></CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2"><Users className="h-4 w-4" /> Team Members</CardTitle>
          </CardHeader>
          <CardContent>
            {members.length === 0 ? (
              <p className="text-sm text-muted-foreground">No members assigned</p>
            ) : (
              <div className="space-y-3">
                {members.map((m) => (
                  <div key={m.id} className="flex items-center justify-between rounded-lg border px-3 py-2">
                    <div>
                      <p className="text-sm font-medium">{m.name}</p>
                      <p className="text-xs text-muted-foreground">{m.email}</p>
                    </div>
                    <Badge variant="outline">{m.role}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2"><Calendar className="h-4 w-4" /> Recent Reports</CardTitle>
          </CardHeader>
          <CardContent>
            {reports.length === 0 ? (
              <p className="text-sm text-muted-foreground">No reports yet</p>
            ) : (
              <div className="space-y-2">
                {reports.slice(0, 5).map((r) => (
                  <div key={r.id} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
                    <div className="flex items-center gap-2">
                      <FileText className="h-3 w-3 text-muted-foreground" />
                      <span className="font-medium">{r.user?.name || "Unknown"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {new Date(r.weekStartDate).toLocaleDateString()} - {new Date(r.weekEndDate).toLocaleDateString()}
                      </span>
                      <Badge variant={r.status === "SUBMITTED" ? "success" : r.status === "DRAFT" ? "warning" : "destructive"} className="text-[10px] px-1.5 py-0">
                        {r.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">All Reports</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {reports.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No reports for this project</p>
          ) : (
            <ReportTable reports={reports} showUser />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
