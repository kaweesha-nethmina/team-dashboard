"use client"

import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, CheckCircle2, AlertTriangle, FileSpreadsheet } from "lucide-react"
import type { Report } from "@/types"

const statusVariant: Record<string, "success" | "warning" | "secondary" | "destructive" | "outline"> = {
  SUBMITTED: "success", DRAFT: "warning", LATE: "destructive",
}

const statusIcon: Record<string, React.ComponentType<any>> = {
  SUBMITTED: CheckCircle2,
  DRAFT: Clock,
  LATE: AlertTriangle,
}

export function ReportTable({ reports, showUser = false }: {
  reports: Report[]
  showUser?: boolean
}) {
  const router = useRouter()

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50 text-xs font-bold uppercase tracking-wider text-gray-500">
              {showUser && <th className="py-4 px-6">Team Member</th>}
              <th className="py-4 px-6">Project Name</th>
              <th className="py-4 px-6">Reporting Period</th>
              <th className="py-4 px-6 text-center">Hours Worked</th>
              <th className="py-4 px-6">Status</th>
              <th className="py-4 px-6">Submitted Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {reports.map((report) => {
              const initials = report.user?.name 
                ? report.user.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) 
                : "U"
              
              const Icon = statusIcon[report.status] || Clock

              return (
                <tr
                  key={report.id}
                  className="hover:bg-indigo-50/20 cursor-pointer transition-colors duration-150"
                  onClick={() => router.push(`/reports/${report.id}`)}
                >
                  {showUser && (
                    <td className="py-4.5 px-6">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-indigo-50 border border-indigo-100/60 flex items-center justify-center text-xs font-bold text-indigo-600">
                          {initials}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800 text-sm leading-tight">{report.user?.name}</p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">{report.user?.role?.toLowerCase()}</p>
                        </div>
                      </div>
                    </td>
                  )}
                  <td className="py-4.5 px-6">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="h-4.5 w-4.5 text-gray-400" />
                      <span className="font-semibold text-gray-800">{report.project.name}</span>
                    </div>
                  </td>
                  <td className="py-4.5 px-6 text-gray-600 font-medium">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="whitespace-nowrap">
                        {new Date(report.weekStartDate).toLocaleDateString()} - {new Date(report.weekEndDate).toLocaleDateString()}
                      </span>
                    </div>
                  </td>
                  <td className="py-4.5 px-6 text-center font-bold text-gray-800">
                    {report.hoursWorked ? `${report.hoursWorked} hrs` : "-"}
                  </td>
                  <td className="py-4.5 px-6">
                    <Badge variant={statusVariant[report.status] || "outline"} className="inline-flex items-center gap-1 px-2.5 py-0.5 font-bold uppercase text-[9px] tracking-wide">
                      <Icon className="h-3 w-3" />
                      {report.status}
                    </Badge>
                  </td>
                  <td className="py-4.5 px-6 text-gray-500 font-medium">
                    {report.submittedAt ? new Date(report.submittedAt).toLocaleDateString() : (
                      <span className="text-gray-300 font-normal">-</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
