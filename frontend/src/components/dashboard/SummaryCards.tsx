"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, FileText, AlertTriangle, TrendingUp } from "lucide-react"
import type { DashboardSummary } from "@/types"

const cards = [
  { key: "submittedReports" as const, label: "Submitted Reports", icon: FileText, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10 dark:bg-emerald-500/20" },
  { key: "complianceRate" as const, label: "Compliance Rate", icon: TrendingUp, suffix: "%", color: "text-teal-600 dark:text-teal-400", bg: "bg-teal-500/10 dark:bg-teal-500/20" },
  { key: "openBlockers" as const, label: "Open Blockers", icon: AlertTriangle, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/10 dark:bg-amber-500/20" },
  { key: "totalMembers" as const, label: "Team Members", icon: Users, color: "text-emerald-700 dark:text-emerald-300", bg: "bg-emerald-500/20 dark:bg-emerald-500/30" },
]

export function SummaryCards({ data }: { data: DashboardSummary }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const value = data[card.key] ?? 0
        return (
          <Card key={card.key} className="transition-all duration-300 hover:-translate-y-1 hover:shadow-lg border-border hover:border-emerald-500/30 bg-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground">{card.label}</CardTitle>
              <div className={`p-2.5 rounded-xl ${card.bg}`}><card.icon className={`h-4.5 w-4.5 ${card.color}`} /></div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tracking-tight text-foreground">{value}{card.suffix || ""}</div>
              {card.key === "complianceRate" && (
                <div className="mt-3.5 h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-emerald-600 to-teal-500 rounded-full transition-all" style={{ width: `${value}%` }} />
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
