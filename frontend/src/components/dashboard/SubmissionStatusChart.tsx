"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import type { MemberStatus } from "@/types"

interface TooltipPayloadItem {
  name: string
  value: number
  stroke?: string
  fill?: string
}

interface CustomTooltipProps {
  active?: boolean
  payload?: TooltipPayloadItem[]
  label?: string
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card/95 backdrop-blur-sm border border-border p-3.5 rounded-xl shadow-xl">
        <p className="text-[10px] font-bold text-muted-foreground mb-1.5 uppercase tracking-wider">{label}</p>
        <div className="space-y-1">
          {payload.map((pld) => (
            <div key={pld.name} className="flex items-center gap-4 text-xs font-semibold">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: pld.fill }} />
              <span className="text-muted-foreground">{pld.name}:</span>
              <span className="text-foreground ml-auto">{pld.value}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }
  return null
}

export function SubmissionStatusChart({ data }: { data: MemberStatus[] }) {
  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow border-border bg-card rounded-2xl">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-bold text-foreground">Submission Status by Member</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} dy={10} />
              <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} dx={-5} />
              <Tooltip content={<CustomTooltip />} />
              <Legend verticalAlign="top" height={36} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, fontWeight: 500, color: 'hsl(var(--muted-foreground))' }} />
              <Bar dataKey="submitted" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} name="Submitted" />
              <Bar dataKey="draft" stackId="a" fill="#d97706" radius={[0, 0, 0, 0]} name="Draft" />
              <Bar dataKey="late" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} name="Late" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
