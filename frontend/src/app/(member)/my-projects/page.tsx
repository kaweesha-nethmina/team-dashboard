"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { api } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FolderKanban, FileText } from "lucide-react"
import type { Project } from "@/types"

export default function MyProjectsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return
    if (!user) { router.push("/login"); return }
    if (user.role === "MANAGER") { router.push("/dashboard"); return }
    loadProjects()
  }, [user, authLoading])

  const loadProjects = async () => {
    try {
      const data = await api.projects.getAll({ assignedToMe: "true" })
      setProjects(data)
    } catch (err) {
      console.error("Failed to load projects:", err)
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Projects</h1>
        <p className="text-muted-foreground">Projects you are assigned to</p>
      </div>

      {projects.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">You are not assigned to any projects yet.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Card key={project.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <FolderKanban className="h-5 w-5 text-muted-foreground shrink-0" />
                  <CardTitle className="text-lg">{project.name}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {project.description && (
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{project.description}</p>
                )}
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span><FileText className="h-3 w-3 inline mr-1" />{project._count?.reports || 0} reports</span>
                </div>
                {project.createdBy && (
                  <p className="text-xs text-muted-foreground mt-2">Created by {project.createdBy.name}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
