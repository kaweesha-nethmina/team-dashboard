"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { api } from "@/lib/api"
import Link from "next/link"
import { useRouter } from "next/navigation"
import type { Report } from "@/types"

const statusVariant: Record<string, "success" | "warning" | "secondary" | "outline" | "destructive"> = {
  SUBMITTED: "success", DRAFT: "warning", LATE: "destructive",
}

export function ReportCard({ report, onUpdate }: { report: Report; onUpdate?: () => void }) {
  const router = useRouter()

  const handleSubmit = async () => {
    try {
      await api.reports.submit(report.id)
      onUpdate?.()
      router.refresh()
    } catch (err) {
      console.error("Failed to submit report:", err)
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle className="text-lg">{report.project.name}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {new Date(report.weekStartDate).toLocaleDateString()} - {new Date(report.weekEndDate).toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={statusVariant[report.status] || "outline"}>{report.status}</Badge>
          {report.hoursWorked && <span className="text-sm text-muted-foreground">{report.hoursWorked}h</span>}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="text-sm font-semibold text-muted-foreground mb-1">Completed</h4>
          <p className="text-sm whitespace-pre-wrap">{report.tasksCompleted}</p>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-muted-foreground mb-1">Planned</h4>
          <p className="text-sm whitespace-pre-wrap">{report.tasksPlanned}</p>
        </div>
        {report.blockers && (
          <div>
            <h4 className="text-sm font-semibold text-destructive mb-1">Blockers</h4>
            <p className="text-sm whitespace-pre-wrap">{report.blockers}</p>
          </div>
        )}
        {report.status === "DRAFT" && (
          <div className="flex gap-2 pt-2">
            <Button size="sm" onClick={handleSubmit}>Submit</Button>
            <Link href={`/my-reports/${report.id}/edit`}>
              <Button size="sm" variant="outline">Edit</Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
