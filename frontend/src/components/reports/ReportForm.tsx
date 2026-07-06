"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { api } from "@/lib/api"
import type { Project } from "@/types"

export function ReportForm({ projects, initialData, onSuccess }: {
  projects: Project[]
  initialData?: any
  onSuccess?: () => void
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    projectId: initialData?.projectId || "",
    weekStartDate: initialData?.weekStartDate?.slice(0, 10) || "",
    weekEndDate: initialData?.weekEndDate?.slice(0, 10) || "",
    tasksCompleted: initialData?.tasksCompleted || "",
    tasksPlanned: initialData?.tasksPlanned || "",
    blockers: initialData?.blockers || "",
    hoursWorked: initialData?.hoursWorked?.toString() || "",
    notes: initialData?.notes || "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const payload = { ...formData, hoursWorked: formData.hoursWorked ? parseFloat(formData.hoursWorked) : null }
      if (initialData?.id) {
        await api.reports.update(initialData.id, payload)
      } else {
        await api.reports.create(payload)
      }
      onSuccess?.()
      router.push("/my-reports")
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save report")
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
      <div className="space-y-2">
        <Label htmlFor="tasksCompleted">Tasks completed</Label>
        <Textarea id="tasksCompleted" placeholder="List what you accomplished this week..."
          value={formData.tasksCompleted} onChange={(e) => setFormData((p) => ({ ...p, tasksCompleted: e.target.value }))} required rows={4} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="tasksPlanned">Tasks planned</Label>
        <Textarea id="tasksPlanned" placeholder="List what you plan to work on next week..."
          value={formData.tasksPlanned} onChange={(e) => setFormData((p) => ({ ...p, tasksPlanned: e.target.value }))} required rows={4} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="blockers">Blockers</Label>
        <Textarea id="blockers" placeholder="Any blockers or issues..."
          value={formData.blockers} onChange={(e) => setFormData((p) => ({ ...p, blockers: e.target.value }))} rows={3} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" placeholder="Additional notes..."
          value={formData.notes} onChange={(e) => setFormData((p) => ({ ...p, notes: e.target.value }))} rows={2} />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-4">
        <Button type="submit" disabled={loading}>{loading ? "Saving..." : initialData ? "Update" : "Create report"}</Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
      </div>
    </form>
  )
}
