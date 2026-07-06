import type { Metadata } from "next"
import "./globals.css"
import { AuthProvider } from "@/hooks/useAuth"
import { Navbar } from "@/components/layout/Navbar"

export const metadata: Metadata = {
  title: "TeamDash - Weekly Report Generator",
  description: "Team dashboard and weekly report management system",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background antialiased">
        <AuthProvider>
          <Navbar />
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  )
}
