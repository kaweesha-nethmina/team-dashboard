"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { api } from "@/lib/api"
import { ReportCard } from "@/components/reports/ReportCard"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import type { Report } from "@/types"

export default function MyReportsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return
    if (!user) { router.push("/login"); return }
    if (user.role === "MANAGER") { router.push("/dashboard"); return }
    loadReports()
  }, [user, authLoading])

  const loadReports = async () => {
    try {
      const data = await api.reports.getMyReports()
      setReports(data)
    } catch (err) {
      console.error("Failed to load reports:", err)
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Reports</h1>
          <p className="text-muted-foreground">Manage your weekly reports</p>
        </div>
        <Link href="/my-reports/new"><Button><Plus className="h-4 w-4 mr-2" />New Report</Button></Link>
      </div>
      {reports.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">No reports yet. Create your first one!</p>
      ) : (
        <div className="grid gap-4">{reports.map((r) => <ReportCard key={r.id} report={r} onUpdate={loadReports} />)}</div>
      )}
    </div>
  )
}
