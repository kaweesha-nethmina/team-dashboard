"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import type { MemberStatus } from "@/types"

export function SubmissionStatusChart({ data }: { data: MemberStatus[] }) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-lg">Submission Status by Member</CardTitle></CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="submitted" stackId="a" fill="#22c55e" name="Submitted" />
              <Bar dataKey="draft" stackId="a" fill="#eab308" name="Draft" />
              <Bar dataKey="late" stackId="a" fill="#ef4444" name="Late" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
