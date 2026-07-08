"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, FileText, AlertTriangle, TrendingUp } from "lucide-react"
import type { DashboardSummary } from "@/types"

const cards = [
  { key: "submittedReports" as const, label: "Submitted Reports", icon: FileText, color: "text-green-600", bg: "bg-green-100" },
  { key: "complianceRate" as const, label: "Compliance Rate", icon: TrendingUp, suffix: "%", color: "text-indigo-600", bg: "bg-indigo-50" },
  { key: "openBlockers" as const, label: "Open Blockers", icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50" },
  { key: "totalMembers" as const, label: "Team Members", icon: Users, color: "text-violet-600", bg: "bg-violet-50" },
]

export function SummaryCards({ data }: { data: DashboardSummary }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const value = data[card.key] ?? 0
        return (
          <Card key={card.key} className="transition-all duration-300 hover:-translate-y-1 hover:shadow-lg border-gray-100 hover:border-indigo-100/80 bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-gray-500">{card.label}</CardTitle>
              <div className={`p-2.5 rounded-xl ${card.bg}`}><card.icon className={`h-4.5 w-4.5 ${card.color}`} /></div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tracking-tight text-gray-900">{value}{card.suffix || ""}</div>
              {card.key === "complianceRate" && (
                <div className="mt-3.5 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all" style={{ width: `${value}%` }} />
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
