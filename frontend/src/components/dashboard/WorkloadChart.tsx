"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts"
import type { Workload } from "@/types"

const COLORS = ["#4f46e5", "#22c55e", "#eab308", "#ef4444", "#a855f7", "#ec4899"]

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="bg-white/95 backdrop-blur-sm border border-gray-100 p-3 rounded-xl shadow-xl">
        <div className="flex items-center gap-2.5 text-xs font-semibold">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.payload.fill || data.color }} />
          <span className="text-gray-600">{data.name}:</span>
          <span className="text-gray-900 ml-auto">{data.value} reports</span>
        </div>
      </div>
    )
  }
  return null
}

export function WorkloadChart({ data }: { data: Workload[] }) {
  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow border-gray-100 bg-white rounded-2xl">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-bold text-gray-800">Workload by Project</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie 
                data={data} 
                dataKey="reportCount" 
                nameKey="projectName" 
                cx="50%" 
                cy="50%" 
                innerRadius={65}
                outerRadius={95} 
                paddingAngle={4}
                cornerRadius={6}
                fill="#8884d8" 
                labelLine={false}
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="transparent" />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend verticalAlign="bottom" iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, fontWeight: 500, color: '#475569', paddingTop: 10 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
