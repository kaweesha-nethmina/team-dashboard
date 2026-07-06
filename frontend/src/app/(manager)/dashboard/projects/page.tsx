"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { api } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Edit2, Trash2, Users, FolderKanban, AlertCircle, X } from "lucide-react"
import type { Project, User } from "@/types"

export default function ProjectsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [members, setMembers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [membersOpen, setMembersOpen] = useState(false)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [formData, setFormData] = useState({ name: "", description: "" })
  const [formError, setFormError] = useState("")
  const [formLoading, setFormLoading] = useState(false)
  const [assignUserId, setAssignUserId] = useState("")

  const loadProjects = useCallback(async () => {
    try {
      const data = await api.projects.getAll()
      setProjects(data)
    } catch (err) {
      console.error("Failed to load projects:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (authLoading) return
    if (!user) { router.push("/login"); return }
    if (user.role === "MEMBER") { router.push("/my-reports"); return }
    loadProjects()
  }, [user, authLoading])

  const resetForm = () => {
    setFormData({ name: "", description: "" })
    setFormError("")
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError("")
    if (!formData.name.trim()) { setFormError("Project name is required"); return }
    setFormLoading(true)
    try {
      await api.projects.create({ name: formData.name, description: formData.description })
      setCreateOpen(false)
      resetForm()
      loadProjects()
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Failed to create project")
    } finally {
      setFormLoading(false)
    }
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProject) return
    setFormError("")
    if (!formData.name.trim()) { setFormError("Project name is required"); return }
    setFormLoading(true)
    try {
      await api.projects.update(selectedProject.id, { name: formData.name, description: formData.description })
      setEditOpen(false)
      resetForm()
      setSelectedProject(null)
      loadProjects()
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Failed to update project")
    } finally {
      setFormLoading(false)
    }
  }

  const handleDelete = async (projectId: string) => {
    if (!confirm("Are you sure you want to delete this project? All associated reports will also be deleted.")) return
    try {
      await api.projects.delete(projectId)
      loadProjects()
    } catch (err) {
      console.error("Failed to delete project:", err)
    }
  }

  const openEdit = (project: Project) => {
    setSelectedProject(project)
    setFormData({ name: project.name, description: project.description || "" })
    setEditOpen(true)
  }

  const openMembers = async (project: Project) => {
    setSelectedProject(project)
    setMembersOpen(true)
    try {
      const m = await api.projects.getMembers(project.id)
      setMembers(m)
    } catch (err) {
      console.error("Failed to load members:", err)
    }
  }

  const handleAssignUser = async () => {
    if (!selectedProject || !assignUserId) return
    try {
      await api.projects.assignUser(selectedProject.id, assignUserId)
      setAssignUserId("")
      const updated = await api.projects.getMembers(selectedProject.id)
      setMembers(updated)
    } catch (err) {
      console.error("Failed to assign user:", err)
    }
  }

  const handleRemoveUser = async (userId: string) => {
    if (!selectedProject) return
    try {
      await api.projects.removeUser(selectedProject.id, userId)
      const updated = await api.projects.getMembers(selectedProject.id)
      setMembers(updated)
    } catch (err) {
      console.error("Failed to remove user:", err)
    }
  }

  if (authLoading || loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Projects</h1>
          <p className="text-muted-foreground">Manage projects and team assignments</p>
        </div>
        <Dialog open={createOpen} onOpenChange={(o) => { setCreateOpen(o); if (!o) resetForm() }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />New Project</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Project</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Project name</Label>
                <Input id="name" value={formData.name} onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="desc">Description</Label>
                <Textarea id="desc" value={formData.description} onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))} rows={3} />
              </div>
              {formError && <p className="text-sm text-destructive flex items-center gap-1"><AlertCircle className="h-3 w-3" />{formError}</p>}
              <Button type="submit" disabled={formLoading}>{formLoading ? "Creating..." : "Create"}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {projects.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">No projects yet. Create your first one!</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Card key={project.id}>
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <div className="flex items-center gap-2">
                  <FolderKanban className="h-5 w-5 text-muted-foreground" />
                  <CardTitle className="text-lg">{project.name}</CardTitle>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(project)}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(project.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {project.description && <p className="text-sm text-muted-foreground mb-3">{project.description}</p>}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{project._count?.reports || 0} reports</span>
                  <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => openMembers(project)}>
                    <Users className="h-3 w-3 mr-1" /> Members
                  </Button>
                </div>
                {project.createdBy && (
                  <p className="text-xs text-muted-foreground mt-2">Created by {project.createdBy.name}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={editOpen} onOpenChange={(o) => { setEditOpen(o); if (!o) { resetForm(); setSelectedProject(null) } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Project</DialogTitle></DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Project name</Label>
              <Input id="edit-name" value={formData.name} onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-desc">Description</Label>
              <Textarea id="edit-desc" value={formData.description} onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))} rows={3} />
            </div>
            {formError && <p className="text-sm text-destructive flex items-center gap-1"><AlertCircle className="h-3 w-3" />{formError}</p>}
            <Button type="submit" disabled={formLoading}>{formLoading ? "Saving..." : "Save"}</Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={membersOpen} onOpenChange={(o) => { setMembersOpen(o); if (!o) setSelectedProject(null) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Members - {selectedProject?.name}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {members.length === 0 ? (
              <p className="text-sm text-muted-foreground">No members assigned yet</p>
            ) : (
              <div className="space-y-2">
                {members.map((m) => (
                  <div key={m.id} className="flex items-center justify-between rounded-lg border px-3 py-2">
                    <div>
                      <p className="text-sm font-medium">{m.name}</p>
                      <p className="text-xs text-muted-foreground">{m.email}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleRemoveUser(m.id)}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex items-center gap-2">
              <Input placeholder="Enter user ID..." value={assignUserId} onChange={(e) => setAssignUserId(e.target.value)} />
              <Button size="sm" onClick={handleAssignUser} disabled={!assignUserId}>Add</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
