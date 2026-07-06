"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import type { Trend } from "@/types"

export function TasksTrendChart({ data }: { data: Trend[] }) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-lg">Report Trends</CardTitle></CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" tick={{ fontSize: 12 }} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="submitted" stroke="#22c55e" name="Submitted" strokeWidth={2} />
              <Line type="monotone" dataKey="draft" stroke="#eab308" name="Draft" strokeWidth={2} />
              <Line type="monotone" dataKey="late" stroke="#ef4444" name="Late" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
