"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { api } from "@/lib/api"
import { ReportForm } from "@/components/reports/ReportForm"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Project, Report } from "@/types"

export default function EditReportPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const [report, setReport] = useState<Report | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return
    if (!user) { router.push("/login"); return }
    if (user.role === "MANAGER") { router.push("/dashboard"); return }
    loadData()
  }, [user, authLoading])

  const loadData = async () => {
    try {
      const [reportData, projectsData] = await Promise.all([
        api.reports.getById(params.id as string),
        api.projects.getAll(),
      ])
      if (reportData.status === "SUBMITTED") {
        router.push("/my-reports")
        return
      }
      setReport(reportData)
      setProjects(projectsData)
    } catch (err) {
      console.error("Failed to load report:", err)
      router.push("/my-reports")
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>
  }

  if (!report) return null

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader><CardTitle className="text-2xl">Edit Weekly Report</CardTitle></CardHeader>
        <CardContent>
          <ReportForm projects={projects} initialData={report} />
        </CardContent>
      </Card>
    </div>
  )
}
