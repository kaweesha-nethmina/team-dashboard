"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { api } from "@/lib/api"
import { useRouter } from "next/navigation"
import type { Report } from "@/types"

const statusVariant: Record<string, "success" | "warning" | "secondary" | "destructive" | "outline"> = {
  SUBMITTED: "success", DRAFT: "warning", LATE: "destructive",
}

export function ReportTable({ reports, showUser = false, onUpdate }: {
  reports: Report[]
  showUser?: boolean
  onUpdate?: () => void
}) {
  const router = useRouter()

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            {showUser && <th className="text-left py-3 px-4 font-medium">Member</th>}
            <th className="text-left py-3 px-4 font-medium">Project</th>
            <th className="text-left py-3 px-4 font-medium">Week</th>
            <th className="text-left py-3 px-4 font-medium">Hours</th>
            <th className="text-left py-3 px-4 font-medium">Status</th>
            <th className="text-left py-3 px-4 font-medium">Submitted</th>
          </tr>
        </thead>
        <tbody>
          {reports.map((report) => (
            <tr key={report.id} className="border-b hover:bg-muted/50">
              {showUser && <td className="py-3 px-4">{report.user?.name}</td>}
              <td className="py-3 px-4">{report.project.name}</td>
              <td className="py-3 px-4 whitespace-nowrap">
                {new Date(report.weekStartDate).toLocaleDateString()} - {new Date(report.weekEndDate).toLocaleDateString()}
              </td>
              <td className="py-3 px-4">{report.hoursWorked || "-"}</td>
              <td className="py-3 px-4"><Badge variant={statusVariant[report.status] || "outline"}>{report.status}</Badge></td>
              <td className="py-3 px-4 text-muted-foreground">
                {report.submittedAt ? new Date(report.submittedAt).toLocaleDateString() : "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
