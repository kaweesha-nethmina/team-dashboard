"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import type { Trend } from "@/types"

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 backdrop-blur-sm border border-gray-100 p-3.5 rounded-xl shadow-xl">
        <p className="text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-wider">{label}</p>
        <div className="space-y-1">
          {payload.map((pld: any) => (
            <div key={pld.name} className="flex items-center gap-4 text-xs font-semibold">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: pld.stroke || pld.fill }} />
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

export function TasksTrendChart({ data }: { data: Trend[] }) {
  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow border-gray-100 bg-white rounded-2xl">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-bold text-gray-800">Report Trends</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorSubmitted" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0.01}/>
                </linearGradient>
                <linearGradient id="colorDraft" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#eab308" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#eab308" stopOpacity={0.01}/>
                </linearGradient>
                <linearGradient id="colorLate" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0.01}/>
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="week" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748b' }} dy={10} />
              <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748b' }} dx={-5} />
              <Tooltip content={<CustomTooltip />} />
              <Legend verticalAlign="top" height={36} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, fontWeight: 500, color: '#475569' }} />
              <Area type="monotone" dataKey="submitted" stroke="#22c55e" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSubmitted)" name="Submitted" />
              <Area type="monotone" dataKey="draft" stroke="#eab308" strokeWidth={2.5} fillOpacity={1} fill="url(#colorDraft)" name="Draft" />
              <Area type="monotone" dataKey="late" stroke="#ef4444" strokeWidth={2.5} fillOpacity={1} fill="url(#colorLate)" name="Late" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
