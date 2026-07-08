"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/hooks/useAuth"
import { api } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, FileText, Clock, User, Calendar } from "lucide-react"
import type { Report } from "@/types"

const statusVariant: Record<string, "success" | "warning" | "secondary" | "destructive" | "outline"> = {
  SUBMITTED: "success", DRAFT: "warning", LATE: "destructive",
}

export default function ReportDetailPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const [report, setReport] = useState<Report | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return
    if (!user) { router.push("/login"); return }
    loadReport()
  }, [user, authLoading])

  const loadReport = async () => {
    try {
      const data = await api.reports.getById(params.id as string)
      setReport(data)
    } catch {
      router.push(user?.role === "MANAGER" ? "/dashboard/reports" : "/my-reports")
    } finally {
      setLoading(false)
    }
  }

  const isOwner = report?.userId === user?.id

  if (authLoading || loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>
  }

  if (!report) return null

  const tasksCompleted = report.tasksCompleted.split("\n").filter(Boolean)
  const tasksPlanned = report.tasksPlanned.split("\n").filter(Boolean)
  const blockers = report.blockers.split("\n").filter(Boolean)
  const backHref = user?.role === "MANAGER" ? "/dashboard/reports" : "/my-reports"

  return (
    <div className="max-w-3xl mx-auto space-y-6 pt-4">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={backHref}><ArrowLeft className="h-5 w-5" /></Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{report.project.name}</h1>
            <Badge variant={statusVariant[report.status] || "outline"} className="text-xs">
              {report.status}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Week of {new Date(report.weekStartDate).toLocaleDateString()} - {new Date(report.weekEndDate).toLocaleDateString()}
          </p>
        </div>
        {isOwner && report.status === "DRAFT" && (
          <Button asChild>
            <Link href={`/my-reports/${report.id}/edit`}>Edit Report</Link>
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium text-muted-foreground">Week</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              {new Date(report.weekStartDate).toLocaleDateString()} - {new Date(report.weekEndDate).toLocaleDateString()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium text-muted-foreground">Hours</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{report.hoursWorked || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium text-muted-foreground">Member</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium">{report.user?.name || "Unknown"}</p>
            <p className="text-xs text-muted-foreground">{report.user?.email}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-4 w-4" /> Tasks Completed
          </CardTitle>
        </CardHeader>
        <CardContent>
          {tasksCompleted.length === 0 ? (
            <p className="text-sm text-muted-foreground">No tasks recorded</p>
          ) : (
            <ul className="space-y-1.5">
              {tasksCompleted.map((t, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-green-500 shrink-0" />
                  {t}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-4 w-4" /> Tasks Planned
          </CardTitle>
        </CardHeader>
        <CardContent>
          {tasksPlanned.length === 0 ? (
            <p className="text-sm text-muted-foreground">No tasks planned</p>
          ) : (
            <ul className="space-y-1.5">
              {tasksPlanned.map((t, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
                  {t}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {blockers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Blockers</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1.5">
              {blockers.map((b, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-red-500 shrink-0" />
                  {b}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {report.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{report.notes}</p>
          </CardContent>
        </Card>
      )}

      {report.submittedAt && (
        <p className="text-xs text-muted-foreground text-center">
          Submitted on {new Date(report.submittedAt).toLocaleString()}
        </p>
      )}
    </div>
  )
}
