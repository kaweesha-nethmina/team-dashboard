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
import { Plus, Edit2, Trash2, Users, FolderKanban, AlertCircle, X, Search, UserCheck } from "lucide-react"
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
  const [searchTerm, setSearchTerm] = useState("")

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

  const filteredProjects = projects.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  if (authLoading || loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Top Banner Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-100 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Projects Workspace</h1>
          <p className="text-sm text-gray-500 font-medium mt-1">Manage core projects and team members assignments</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Search bar inside header row to populate whitespace */}
          <div className="relative w-48 sm:w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input 
              placeholder="Search projects..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-10 rounded-xl bg-white border-gray-200 focus-visible:ring-indigo-500 font-medium text-xs shadow-sm"
            />
          </div>
          
          <Dialog open={createOpen} onOpenChange={(o) => { setCreateOpen(o); if (!o) resetForm() }}>
            <DialogTrigger asChild>
              <Button className="h-10 rounded-xl px-5 font-bold shadow-sm flex items-center gap-1.5"><Plus className="h-4.5 w-4.5" />New Project</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md rounded-2xl">
              <DialogHeader><DialogTitle className="text-xl font-bold">Create New Project</DialogTitle></DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="name" className="font-semibold text-gray-700">Project name</Label>
                  <Input id="name" value={formData.name} onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))} required className="rounded-xl border-gray-200" placeholder="e.g. Website Redesign" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="desc" className="font-semibold text-gray-700">Description</Label>
                  <Textarea id="desc" value={formData.description} onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))} rows={3} className="rounded-xl border-gray-200" placeholder="Summarize project scope..." />
                </div>
                {formError && <p className="text-sm text-destructive flex items-center gap-1.5 font-semibold"><AlertCircle className="h-4 w-4" />{formError}</p>}
                <Button type="submit" disabled={formLoading} className="w-full rounded-xl py-2 font-bold">{formLoading ? "Creating..." : "Create Project"}</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {filteredProjects.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm max-w-md mx-auto">
          <FolderKanban className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <h3 className="font-bold text-gray-800 text-lg">No Projects Found</h3>
          <p className="text-sm text-gray-400 mt-1 px-6">
            {searchTerm ? "No projects match your search query. Try another keyword." : "Create your first project to start tracking reports."}
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((project) => (
            <Card key={project.id} className="transition-all duration-300 hover:-translate-y-1 hover:shadow-lg border-gray-100 hover:border-indigo-100/80 bg-white rounded-2xl flex flex-col justify-between overflow-hidden">
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-100/50">
                    <FolderKanban className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-extrabold text-gray-800 leading-tight">{project.name}</CardTitle>
                    {project.createdBy && (
                      <p className="text-[10px] text-gray-400 mt-0.5 font-bold">BY {project.createdBy.name.toUpperCase()}</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-0.5">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-gray-600 rounded-lg" onClick={() => openEdit(project)}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive/70 hover:text-destructive hover:bg-destructive/10 rounded-lg" onClick={() => handleDelete(project.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-between pt-1">
                <div>
                  <p className="text-sm text-gray-500 leading-relaxed font-medium line-clamp-2 min-h-[40px] mb-4">
                    {project.description || "No description provided. Add one to describe project scope and outline."}
                  </p>
                </div>
                
                <div className="border-t border-gray-50 pt-4 flex items-center justify-between">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-bold text-gray-800">{project._count?.reports || 0} reports</span>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Total Submissions</span>
                  </div>

                  <Button variant="outline" size="sm" className="h-8 rounded-lg text-xs font-bold border-gray-200 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-100 transition-all" onClick={() => openMembers(project)}>
                    <Users className="h-3.5 w-3.5 mr-1.5" /> Members
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={(o) => { setEditOpen(o); if (!o) { resetForm(); setSelectedProject(null) } }}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader><DialogTitle className="text-xl font-bold">Edit Project</DialogTitle></DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="edit-name" className="font-semibold text-gray-700">Project name</Label>
              <Input id="edit-name" value={formData.name} onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))} required className="rounded-xl border-gray-200" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-desc" className="font-semibold text-gray-700">Description</Label>
              <Textarea id="edit-desc" value={formData.description} onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))} rows={3} className="rounded-xl border-gray-200" />
            </div>
            {formError && <p className="text-sm text-destructive flex items-center gap-1.5 font-semibold"><AlertCircle className="h-4 w-4" />{formError}</p>}
            <Button type="submit" disabled={formLoading} className="w-full rounded-xl py-2 font-bold">{formLoading ? "Saving..." : "Save Changes"}</Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Members Dialog */}
      <Dialog open={membersOpen} onOpenChange={(o) => { setMembersOpen(o); if (!o) setSelectedProject(null) }}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <Users className="h-5 w-5 text-indigo-600" /> Project Members - {selectedProject?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            {members.length === 0 ? (
              <div className="text-center py-6 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                <p className="text-xs text-gray-400 font-medium">No members assigned to this project yet.</p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                {members.map((m) => {
                  const mInitials = m.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
                  return (
                    <div key={m.id} className="flex items-center justify-between rounded-xl border border-gray-100 bg-white p-2.5 shadow-sm hover:border-gray-200 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-indigo-50 flex items-center justify-center text-[11px] font-bold text-indigo-600">
                          {mInitials}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-800 leading-tight">{m.name}</p>
                          <p className="text-[10px] text-gray-400 font-medium mt-0.5">{m.email}</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive/70 hover:text-destructive hover:bg-destructive/10 rounded-lg" onClick={() => handleRemoveUser(m.id)}>
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )
                })}
              </div>
            )}
            
            <div className="border-t border-gray-50 pt-4 space-y-2">
              <Label className="text-xs font-bold text-gray-600 flex items-center gap-1.5 mb-1">
                <UserCheck className="h-4 w-4 text-gray-400" /> Assign User
              </Label>
              <div className="flex items-center gap-2">
                <Input placeholder="Enter member user ID..." value={assignUserId} onChange={(e) => setAssignUserId(e.target.value)} className="rounded-xl border-gray-200 text-xs h-9.5" />
                <Button size="sm" onClick={handleAssignUser} disabled={!assignUserId} className="rounded-xl h-9.5 font-bold px-4">Add</Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
