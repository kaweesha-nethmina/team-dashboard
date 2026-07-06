"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { api } from "@/lib/api"
import { ReportTable } from "@/components/reports/ReportTable"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { X, Search } from "lucide-react"
import type { Report, Project } from "@/types"

const STATUSES = ["", "DRAFT", "SUBMITTED", "LATE"] as const

interface Member {
  id: string
  name: string
  email: string
}

export default function TeamReportsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [reports, setReports] = useState<Report[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState("")
  const [projectFilter, setProjectFilter] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [suggestions, setSuggestions] = useState<Member[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [members, setMembers] = useState<Member[]>([])
  const searchRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    api.auth.members().then(setMembers).catch(console.error)
  }, [])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    if (value.length === 0) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }
    const filtered = members.filter(
      (m) =>
        m.name.toLowerCase().includes(value.toLowerCase()) ||
        m.email.toLowerCase().includes(value.toLowerCase())
    )
    setSuggestions(filtered)
    setShowSuggestions(true)
  }

  const selectMember = (member: Member) => {
    setSelectedMember(member)
    setSearchQuery(`${member.name} (${member.email})`)
    setShowSuggestions(false)
  }

  const clearMember = () => {
    setSelectedMember(null)
    setSearchQuery("")
    setSuggestions([])
  }

  const loadReports = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, string> = {}
      if (statusFilter) params.status = statusFilter
      if (projectFilter) params.projectId = projectFilter
      if (startDate) params.startDate = startDate
      if (endDate) params.endDate = endDate
      if (selectedMember) params.userId = selectedMember.id
      const data = await api.reports.getAll(Object.keys(params).length > 0 ? params : undefined)
      setReports(data)
    } catch (err) {
      console.error("Failed to load reports:", err)
    } finally {
      setLoading(false)
    }
  }, [statusFilter, projectFilter, startDate, endDate, selectedMember])

  useEffect(() => {
    if (authLoading) return
    if (!user) { router.push("/login"); return }
    if (user.role === "MEMBER") { router.push("/my-reports"); return }
    loadReports()
    api.projects.getAll().then(setProjects).catch(console.error)
  }, [user, authLoading])

  useEffect(() => {
    loadReports()
  }, [loadReports])

  const clearFilters = () => {
    setStatusFilter("")
    setProjectFilter("")
    setStartDate("")
    setEndDate("")
    clearMember()
  }

  const hasFilters = statusFilter || projectFilter || startDate || endDate || selectedMember

  if (authLoading) {
    return <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Team Reports</h1>
        <p className="text-muted-foreground">View and filter all member reports</p>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1 relative" ref={searchRef}>
          <label className="text-xs font-medium text-muted-foreground">Member</label>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true) }}
              className="w-64 pl-8"
            />
            {selectedMember && (
              <button onClick={clearMember} className="absolute right-2 top-2.5">
                <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
              </button>
            )}
          </div>
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute z-50 top-full mt-1 w-64 bg-popover border rounded-md shadow-lg max-h-48 overflow-y-auto">
              {suggestions.map((m) => (
                <button
                  key={m.id}
                  onClick={() => selectMember(m)}
                  className="w-full text-left px-3 py-2 hover:bg-accent text-sm flex flex-col"
                >
                  <span className="font-medium">{m.name}</span>
                  <span className="text-xs text-muted-foreground">{m.email}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Status</label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32"><SelectValue placeholder="All statuses" /></SelectTrigger>
            <SelectContent>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s}>{s || "All statuses"}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Project</label>
          <Select value={projectFilter} onValueChange={setProjectFilter}>
            <SelectTrigger className="w-40"><SelectValue placeholder="All projects" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">All projects</SelectItem>
              {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">From</label>
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-36" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">To</label>
          <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-36" />
        </div>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="h-4 w-4 mr-1" /> Clear
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : reports.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">No reports found</p>
          ) : (
            <ReportTable reports={reports} showUser />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
