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
import { LayoutDashboard, ArrowUpRight } from "lucide-react"
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
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner Card */}
      <div className="relative rounded-2xl overflow-hidden p-6 sm:p-8 bg-gradient-to-r from-indigo-600 via-violet-600 to-pink-500 text-white shadow-lg animate-card-slide-in">
        {/* Decorative elements */}
        <div className="absolute top-[-50%] right-[-10%] w-72 h-72 rounded-full bg-white/10 blur-xl pointer-events-none animate-float-1" />
        <div className="absolute bottom-[-30%] right-[20%] w-48 h-48 rounded-full bg-white/10 blur-lg pointer-events-none animate-float-2" />
        
        <div className="relative z-10 space-y-2">
          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-white/90 bg-white/15 px-3 py-1 rounded-full backdrop-blur-sm">
            <LayoutDashboard className="h-3.5 w-3.5" /> Manager Dashboard
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Welcome back, {user?.name}!</h1>
          <p className="text-sm sm:text-base text-white/80 max-w-2xl leading-relaxed">
            Track weekly report compliance metrics, manage active project details, and address member blockers.
          </p>
        </div>
      </div>

      {/* Grid Layout: Main Area vs Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Content Area (2 Columns) */}
        <div className="lg:col-span-2 space-y-6">
          {summary && <SummaryCards data={summary} />}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <TasksTrendChart data={trends} />
            <SubmissionStatusChart data={memberStatus} />
          </div>

          {workload.length > 0 && <WorkloadChart data={workload} />}
        </div>

        {/* Right Sidebar Area (1 Column) */}
        <div className="space-y-6">
          {/* Quick Actions Panel */}
          <Card className="border-gray-100 shadow-sm bg-white rounded-2xl overflow-hidden">
            <CardHeader className="border-b border-gray-50 pb-3">
              <CardTitle className="text-base font-bold text-gray-800">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-2">
              <button 
                onClick={() => router.push("/dashboard/projects")}
                className="w-full flex items-center justify-between p-3.5 rounded-xl text-sm font-semibold text-gray-700 bg-gray-50 hover:bg-indigo-50 hover:text-indigo-600 transition-colors border border-transparent hover:border-indigo-100/50 group"
              >
                <span>Manage Projects</span>
                <ArrowUpRight className="h-4.5 w-4.5 text-gray-400 group-hover:text-indigo-600 transition-colors" />
              </button>
              <button 
                onClick={() => router.push("/dashboard/reports")}
                className="w-full flex items-center justify-between p-3.5 rounded-xl text-sm font-semibold text-gray-700 bg-gray-50 hover:bg-indigo-50 hover:text-indigo-600 transition-colors border border-transparent hover:border-indigo-100/50 group"
              >
                <span>View Team Reports</span>
                <ArrowUpRight className="h-4.5 w-4.5 text-gray-400 group-hover:text-indigo-600 transition-colors" />
              </button>
            </CardContent>
          </Card>

          {/* Recent Activity Card */}
          <Card className="border-gray-100 shadow-sm bg-white rounded-2xl">
            <CardHeader className="pb-3 border-b border-gray-50">
              <CardTitle className="text-base font-bold text-gray-800">Recent Submissions</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {recentActivity.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6 font-medium">No recent reports</p>
              ) : (
                <div className="space-y-4">
                  {recentActivity.map((a) => (
                    <div key={a.id} className="flex items-start justify-between border-b border-gray-50 pb-3 last:border-0 last:pb-0 last:border-b-0">
                      <div className="space-y-0.5">
                        <p className="text-sm font-bold text-gray-800">{a.user.name}</p>
                        <p className="text-xs text-gray-500 font-semibold">{a.project.name}</p>
                        <p className="text-[10px] text-gray-400 font-bold">
                          {new Date(a.weekStartDate).toLocaleDateString()} - {new Date(a.weekEndDate).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant="success" className="text-[9px] px-2 py-0.5 font-bold uppercase tracking-wider">
                        Submitted
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <AIChatWidget />
    </div>
  )
}
