"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import type { MemberStatus } from "@/types"

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 backdrop-blur-sm border border-gray-100 p-3.5 rounded-xl shadow-xl">
        <p className="text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-wider">{label}</p>
        <div className="space-y-1">
          {payload.map((pld: any) => (
            <div key={pld.name} className="flex items-center gap-4 text-xs font-semibold">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: pld.fill }} />
              <span className="text-gray-600">{pld.name}:</span>
              <span className="text-gray-900 ml-auto">{pld.value}</span>
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
    <Card className="shadow-sm hover:shadow-md transition-shadow border-gray-100 bg-white rounded-2xl">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-bold text-gray-800">Submission Status by Member</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748b' }} dy={10} />
              <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748b' }} dx={-5} />
              <Tooltip content={<CustomTooltip />} />
              <Legend verticalAlign="top" height={36} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, fontWeight: 500, color: '#475569' }} />
              <Bar dataKey="submitted" stackId="a" fill="#22c55e" radius={[0, 0, 0, 0]} name="Submitted" />
              <Bar dataKey="draft" stackId="a" fill="#eab308" radius={[0, 0, 0, 0]} name="Draft" />
              <Bar dataKey="late" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} name="Late" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
