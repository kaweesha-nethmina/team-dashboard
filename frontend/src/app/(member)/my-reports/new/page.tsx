"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { api } from "@/lib/api"
import { ReportForm } from "@/components/reports/ReportForm"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Project, Report } from "@/types"

function getCurrentWeekStart(): string {
  const now = new Date()
  const dayOfWeek = now.getDay()
  const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
  const monday = new Date(now)
  monday.setDate(now.getDate() - diffToMonday)
  return monday.toISOString().slice(0, 10)
}

function NewReportFormContainer() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const projectId = searchParams.get("projectId")
  const [projects, setProjects] = useState<Project[]>([])
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    if (authLoading) return
    if (!user) { router.push("/login"); return }
    if (user.role === "MANAGER") { router.push("/dashboard"); return }

    const init = async () => {
      try {
        const projectsData = await api.projects.getAll({ assignedToMe: "true" }) as Project[]
        setProjects(projectsData)

        const weekStart = getCurrentWeekStart()
        const myReports = await api.reports.getMyReports() as Report[]
        const existing = myReports.find((r) =>
          r.weekStartDate?.slice(0, 10) === weekStart
        )
        if (existing) {
          router.replace(`/my-reports/${existing.id}/edit`)
          return
        }
      } catch (err) {
        console.error(err)
      } finally {
        setChecking(false)
      }
    }
    init()
  }, [user, authLoading])

  const initialData = projectId ? { projectId } : undefined

  if (authLoading || checking) {
    return <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader><CardTitle className="text-2xl">Create Weekly Report</CardTitle></CardHeader>
        <CardContent><ReportForm projects={projects} initialData={initialData} /></CardContent>
      </Card>
    </div>
  )
}

export default function NewReportPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    }>
      <NewReportFormContainer />
    </Suspense>
  )
}
