import type React from "react"
import { Sidebar } from "@/components/sidebar"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: Readonly<DashboardLayoutProps>) {
  return (
    <div className="flex h-screen bg-background stonks-bg overflow-hidden">
      <Sidebar />

      {/* Main takes remaining space, no scroll here */}
      <main className="flex-1 ml-64 flex flex-col min-h-0 overflow-hidden">
        {children}
      </main>

      <style jsx>{`
        .stonks-bg {
          background-image: url('/stonks-bg.png'); /* Image inside /public */
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
        }
      `}</style>
    </div>
  )
}
