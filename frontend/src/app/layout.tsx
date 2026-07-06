import type { Metadata } from "next"
import "./globals.css"
import { AuthProvider } from "@/hooks/useAuth"
import { Sidebar } from "@/components/layout/Sidebar"

export const metadata: Metadata = {
  title: "TeamDash - Weekly Report Generator",
  description: "Team dashboard and weekly report management system",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background antialiased">
        <AuthProvider>
          <div className="flex">
            <Sidebar />
            <main className="flex-1 md:pl-60 pt-14 md:pt-0 min-h-screen">
              {children}
            </main>
          </div>
        </AuthProvider>
      </body>
    </html>
  )
}
