"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { api } from "@/lib/api"
import { SummaryCards } from "@/components/dashboard/SummaryCards"
import { TasksTrendChart } from "@/components/dashboard/TasksTrendChart"
import { SubmissionStatusChart } from "@/components/dashboard/SubmissionStatusChart"
import { WorkloadChart } from "@/components/dashboard/WorkloadChart"
import { AIChatWidget } from "@/components/chat/AIChatWidget"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { DashboardSummary, Trend, MemberStatus, Workload, RecentActivity } from "@/types"

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [trends, setTrends] = useState<Trend[]>([])
  const [memberStatus, setMemberStatus] = useState<MemberStatus[]>([])
  const [workload, setWorkload] = useState<Workload[]>([])
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return
    if (!user) { router.push("/login"); return }
    if (user.role === "MEMBER") { router.push("/my-reports"); return }
    loadData()
  }, [user, authLoading])

  const loadData = async () => {
    try {
      const [s, t, ms, wl, ra] = await Promise.all([
        api.dashboard.getSummary(),
        api.dashboard.getTrends(),
        api.dashboard.getMemberStatus(),
        api.dashboard.getWorkload(),
        api.dashboard.getRecentActivity(5),
      ])
      setSummary(s)
      setTrends(t)
      setMemberStatus(ms)
      setWorkload(wl)
      setRecentActivity(ra)
    } catch (err) {
      console.error("Failed to load dashboard data:", err)
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Team overview and performance metrics</p>
      </div>

      {summary && <SummaryCards data={summary} />}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TasksTrendChart data={trends} />
        <SubmissionStatusChart data={memberStatus} />
      </div>

      {workload.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <WorkloadChart data={workload} />
          <Card>
            <CardHeader><CardTitle className="text-lg">Recent Activity</CardTitle></CardHeader>
            <CardContent>
              {recentActivity.length === 0 ? (
                <p className="text-sm text-muted-foreground">No recent submissions</p>
              ) : (
                <div className="space-y-4">
                  {recentActivity.map((a) => (
                    <div key={a.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                      <div>
                        <p className="text-sm font-medium">{a.user.name}</p>
                        <p className="text-xs text-muted-foreground">{a.project.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">
                          {new Date(a.weekStartDate).toLocaleDateString()} - {new Date(a.weekEndDate).toLocaleDateString()}
                        </p>
                        <Badge variant="success" className="text-xs">Submitted</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <AIChatWidget />
    </div>
  )
}
