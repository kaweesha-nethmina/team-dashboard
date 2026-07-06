"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"

export default function HomePage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading) return
    if (!user) router.push("/login")
    else if (user.role === "MANAGER") router.push("/dashboard")
    else router.push("/my-reports")
  }, [user, loading, router])

  return (
    <div className="flex justify-center py-12">
      <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
    </div>
  )
}
