"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { useAuth } from "@/hooks/useAuth"
import { api } from "@/lib/api"
import { ReportCard } from "@/components/reports/ReportCard"
import { Button } from "@/components/ui/button"
import { CardSkeleton } from "@/components/ui/skeleton"
import { Plus, ChevronDown } from "lucide-react"
import type { Report } from "@/types"

function formatWeekLabel(startDate: string): string {
  const d = new Date(startDate)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays < 7) return "This Week"
  if (diffDays < 14) return "Last Week"
  return `Week of ${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
}

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

  const grouped = reports.reduce<Record<string, Report[]>>((acc, r) => {
    const weekKey = r.weekStartDate.slice(0, 10)
    if (!acc[weekKey]) acc[weekKey] = []
    acc[weekKey].push(r)
    return acc
  }, {})

  const weekKeys = Object.keys(grouped).sort().reverse()

  if (authLoading || loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-9 w-40 bg-muted animate-pulse rounded" />
            <div className="h-5 w-64 bg-muted animate-pulse rounded mt-1" />
          </div>
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => <CardSkeleton key={i} />)}
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
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
        <div className="space-y-8">
          {weekKeys.map((weekKey) => (
            <div key={weekKey}>
              <div className="flex items-center gap-2 mb-3">
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-lg font-semibold">{formatWeekLabel(weekKey)}</h2>
                <span className="text-xs text-muted-foreground">({grouped[weekKey].length} report{grouped[weekKey].length > 1 ? "s" : ""})</span>
              </div>
              <div className="grid gap-4">
                {grouped[weekKey].map((r, i) => (
                  <motion.div
                    key={r.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.05 }}
                  >
                    <ReportCard report={r} onUpdate={loadReports} />
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  )
}
