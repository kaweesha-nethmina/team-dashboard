"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, FileText, AlertTriangle, TrendingUp } from "lucide-react"
import type { DashboardSummary } from "@/types"

const cards = [
  { key: "submittedReports" as const, label: "Submitted Reports", icon: FileText, color: "text-green-600", bg: "bg-green-100" },
  { key: "complianceRate" as const, label: "Compliance Rate", icon: TrendingUp, suffix: "%", color: "text-blue-600", bg: "bg-blue-100" },
  { key: "openBlockers" as const, label: "Open Blockers", icon: AlertTriangle, color: "text-red-600", bg: "bg-red-100" },
  { key: "totalMembers" as const, label: "Team Members", icon: Users, color: "text-purple-600", bg: "bg-purple-100" },
]

export function SummaryCards({ data }: { data: DashboardSummary }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const value = data[card.key] ?? 0
        return (
          <Card key={card.key}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{card.label}</CardTitle>
              <div className={`p-2 rounded-full ${card.bg}`}><card.icon className={`h-4 w-4 ${card.color}`} /></div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{value}{card.suffix || ""}</div>
              {card.key === "complianceRate" && (
                <div className="mt-2 h-2 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${value}%` }} />
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
