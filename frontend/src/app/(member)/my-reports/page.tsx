"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { api } from "@/lib/api"
import { ReportTable } from "@/components/reports/ReportTable"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import { Plus, Pencil, CheckCircle, Clock, Calendar, BookmarkCheck } from "lucide-react"
import type { Report } from "@/types"

function getCurrentWeekStart(): string {
  const now = new Date()
  const dayOfWeek = now.getDay()
  const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
  const monday = new Date(now)
  monday.setDate(now.getDate() - diffToMonday)
  return monday.toISOString().slice(0, 10)
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

  if (authLoading || loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  // Calculate some simple stats for the member sidebar
  const totalReports = reports.length
  const submittedCount = reports.filter((r) => r.status === "SUBMITTED").length
  const draftCount = reports.filter((r) => r.status === "DRAFT").length
  const lateCount = reports.filter((r) => r.status === "LATE").length

  // Check if user already has a report for the current week
  const currentWeekStart = getCurrentWeekStart()
  const currentWeekReport = reports.find((r) =>
    r.weekStartDate?.slice(0, 10) === currentWeekStart
  )

  return (
    <div className="space-y-6">
      <div className="relative rounded-2xl overflow-hidden p-6 sm:p-8 bg-gradient-to-r from-emerald-800 via-teal-800 to-amber-700 dark:from-emerald-950 dark:via-teal-950 dark:to-amber-950 text-white shadow-lg animate-card-slide-in">
        {/* Decorative background visual shapes */}
        <div className="absolute top-[-50%] right-[-10%] w-72 h-72 rounded-full bg-white/10 blur-xl pointer-events-none animate-float-1" />
        <div className="absolute bottom-[-30%] right-[20%] w-48 h-48 rounded-full bg-white/10 blur-lg pointer-events-none animate-float-2" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-white/90 bg-white/15 px-3 py-1 rounded-full backdrop-blur-sm">
              <BookmarkCheck className="h-3.5 w-3.5" /> Member Workspace
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Hello, {user?.name}!</h1>
            <p className="text-sm sm:text-base text-white/80 max-w-xl leading-relaxed">
              Log your project work hours, document completed/planned accomplishments, and call out blockers for manager feedback.
            </p>
          </div>
          <div className="flex-shrink-0">
            {currentWeekReport ? (
              <Link href={`/my-reports/${currentWeekReport.id}/edit`}>
                <Button className="h-11 rounded-xl px-6 bg-white hover:bg-emerald-50 text-emerald-700 hover:text-emerald-800 font-extrabold shadow-md flex items-center gap-1.5 transition-all transform active:scale-95">
                  <Pencil className="h-5 w-5" /> {currentWeekReport.status === "SUBMITTED" ? "View This Week" : "Edit This Week"}
                </Button>
              </Link>
            ) : (
              <Link href="/my-reports/new">
                <Button className="h-11 rounded-xl px-6 bg-white hover:bg-emerald-50 text-emerald-700 hover:text-emerald-800 font-extrabold shadow-md flex items-center gap-1.5 transition-all transform active:scale-95">
                  <Plus className="h-5 w-5" /> Submit New Report
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Grid Layout: Reports Table vs Progress Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Main Content: Reports Log List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <h2 className="text-lg font-bold text-foreground">My Reports Log</h2>
              <p className="text-xs text-muted-foreground font-medium mt-0.5">List of your weekly reports and draft entries</p>
            </div>
          </div>
          
          {reports.length === 0 ? (
            <div className="text-center py-16 bg-card rounded-2xl border border-border shadow-sm">
              <Calendar className="h-12 w-12 text-muted-foreground/30 mx-auto mb-2" />
              <h3 className="font-bold text-foreground text-base">No Reports Logged</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">
                You haven&apos;t logged any weekly reports yet. Click &quot;Submit New Report&quot; above to create your first entry.
              </p>
            </div>
          ) : (
            <ReportTable reports={reports} />
          )}
        </div>

        {/* Sidebar Content: Submission Progress / Performance Metrics */}
        <div className="space-y-6">
          {/* Workspace Quick Stats */}
          <Card className="border-border shadow-sm bg-card rounded-2xl overflow-hidden">
            <CardHeader className="border-b border-border pb-3">
              <CardTitle className="text-base font-bold text-foreground">Workspace Statistics</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3.5">
                <div className="bg-muted rounded-xl p-3 border border-border">
                  <span className="text-[10px] text-muted-foreground font-extrabold uppercase tracking-wider">Submitted</span>
                  <p className="text-xl font-black text-green-600 dark:text-green-400 mt-1">{submittedCount}</p>
                </div>
                <div className="bg-muted rounded-xl p-3 border border-border">
                  <span className="text-[10px] text-muted-foreground font-extrabold uppercase tracking-wider">Drafts</span>
                  <p className="text-xl font-black text-amber-600 dark:text-amber-400 mt-1">{draftCount}</p>
                </div>
                <div className="bg-muted rounded-xl p-3 border border-border">
                  <span className="text-[10px] text-muted-foreground font-extrabold uppercase tracking-wider">Late Logs</span>
                  <p className="text-xl font-black text-red-600 dark:text-red-400 mt-1">{lateCount}</p>
                </div>
                <div className="bg-muted rounded-xl p-3 border border-border">
                  <span className="text-[10px] text-muted-foreground font-extrabold uppercase tracking-wider">Total</span>
                  <p className="text-xl font-black text-foreground mt-1">{totalReports}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submission checklist guidelines */}
          <Card className="border-border shadow-sm bg-card rounded-2xl">
            <CardHeader className="pb-3 border-b border-border">
              <CardTitle className="text-base font-bold text-foreground flex items-center gap-1.5">
                <Clock className="h-4.5 w-4.5 text-emerald-700 dark:text-emerald-500" /> Submission Rules
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3.5 text-xs font-semibold text-muted-foreground">
              <div className="flex items-start gap-2.5">
                <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                <p className="leading-relaxed">Submit your report every Friday before 5:00 PM local time.</p>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                <p className="leading-relaxed">Keep your blockers updated so your manager can assist promptly.</p>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                <p className="leading-relaxed">Track hours worked correctly on each assigned project.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
