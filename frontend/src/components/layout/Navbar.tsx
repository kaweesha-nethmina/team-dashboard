"use client"

import Link from "next/link"
import { useAuth } from "@/hooks/useAuth"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { FileText, LayoutDashboard, FolderKanban, LogOut, Menu } from "lucide-react"
import { useState } from "react"

export function Navbar() {
  const { user, logout } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)

  if (!user) return null

  const initials = user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)

  const navLinks = user.role === "MANAGER"
    ? [
        { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { href: "/dashboard/reports", label: "Team Reports", icon: FileText },
        { href: "/dashboard/projects", label: "Projects", icon: FolderKanban },
      ]
    : [
        { href: "/my-reports", label: "My Reports", icon: FileText },
      ]

  return (
    <nav className="border-b bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href={user.role === "MANAGER" ? "/dashboard" : "/my-reports"} className="flex items-center space-x-2">
              <FileText className="h-6 w-6 text-primary" />
              <span className="font-bold text-xl">TeamDash</span>
            </Link>
            <div className="hidden md:flex ml-10 space-x-4">
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href}
                  className="flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-accent hover:text-accent-foreground transition-colors">
                  <link.icon className="h-4 w-4 mr-2" />
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                    <p className="text-xs text-muted-foreground mt-1 capitalize">{user.role.toLowerCase()}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => logout()}>
                  <LogOut className="mr-2 h-4 w-4" /> Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {mobileOpen && (
          <div className="md:hidden pb-3 space-y-1">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}
                className="flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-accent"
                onClick={() => setMobileOpen(false)}>
                <link.icon className="h-4 w-4 mr-2" /> {link.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  )
}
