"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ItemList } from "@/components/ui/item-list"
import { api } from "@/lib/api"
import { toast } from "sonner"
import type { Project } from "@/types"

function splitItems(val?: string): string[] {
  return val ? val.split("\n").filter((s) => s.trim()) : []
}

function getCurrentWeekDates(): { weekStart: string; weekEnd: string } {
  const now = new Date()
  const dayOfWeek = now.getDay()
  const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
  const monday = new Date(now)
  monday.setDate(now.getDate() - diffToMonday)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  return {
    weekStart: monday.toISOString().slice(0, 10),
    weekEnd: sunday.toISOString().slice(0, 10),
  }
}

export function ReportForm({ projects, initialData, onSuccess }: {
  projects: Project[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialData?: any
  onSuccess?: () => void
}) {
  const router = useRouter()
  const { weekStart, weekEnd } = getCurrentWeekDates()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    projectId: initialData?.projectId || "",
    weekStartDate: initialData?.weekStartDate?.slice(0, 10) || weekStart,
    weekEndDate: initialData?.weekEndDate?.slice(0, 10) || weekEnd,
    tasksCompleted: splitItems(initialData?.tasksCompleted),
    tasksPlanned: splitItems(initialData?.tasksPlanned),
    blockers: splitItems(initialData?.blockers),
    hoursWorked: initialData?.hoursWorked?.toString() || "",
    notes: initialData?.notes || "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const payload = {
        ...formData,
        tasksCompleted: formData.tasksCompleted.join("\n"),
        tasksPlanned: formData.tasksPlanned.join("\n"),
        blockers: formData.blockers.join("\n"),
        hoursWorked: formData.hoursWorked ? parseFloat(formData.hoursWorked) : null,
      }
      if (initialData?.id) {
        await api.reports.update(initialData.id, payload)
        toast.success("Report updated")
      } else {
        await api.reports.create(payload)
        toast.success("Report created")
      }
      onSuccess?.()
      router.push("/my-reports")
      router.refresh()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save report"
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="project">Project</Label>
          <Select value={formData.projectId} onValueChange={(v) => setFormData((p) => ({ ...p, projectId: v }))} required>
            <SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
            <SelectContent>
              {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="hoursWorked">Hours worked</Label>
          <Input id="hoursWorked" type="number" step="0.5" placeholder="e.g. 40"
            value={formData.hoursWorked} onChange={(e) => setFormData((p) => ({ ...p, hoursWorked: e.target.value }))} />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="weekStartDate">Week start</Label>
          <Input id="weekStartDate" type="date" value={formData.weekStartDate}
            onChange={(e) => setFormData((p) => ({ ...p, weekStartDate: e.target.value }))} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="weekEndDate">Week end</Label>
          <Input id="weekEndDate" type="date" value={formData.weekEndDate}
            onChange={(e) => setFormData((p) => ({ ...p, weekEndDate: e.target.value }))} required />
        </div>
      </div>
      <ItemList
        label="Tasks completed"
        items={formData.tasksCompleted}
        onChange={(items) => setFormData((p) => ({ ...p, tasksCompleted: items }))}
        placeholder="Add a completed task..."
      />
      <ItemList
        label="Tasks planned"
        items={formData.tasksPlanned}
        onChange={(items) => setFormData((p) => ({ ...p, tasksPlanned: items }))}
        placeholder="Add a planned task..."
      />
      <ItemList
        label="Blockers"
        items={formData.blockers}
        onChange={(items) => setFormData((p) => ({ ...p, blockers: items }))}
        placeholder="Add a blocker..."
      />
      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <textarea id="notes" placeholder="Additional notes..."
          value={formData.notes} onChange={(e) => setFormData((p) => ({ ...p, notes: e.target.value }))}
          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" rows={3} />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-4">
        <Button type="submit" disabled={loading}>{loading ? "Saving..." : initialData ? "Update" : "Create report"}</Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
      </div>
    </form>
  )
}
