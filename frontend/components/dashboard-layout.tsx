import type React from "react"
import { Sidebar } from "@/components/sidebar"
import { cn } from "@/lib/utils"

interface DashboardLayoutProps {
  children: React.ReactNode
  variant?: "stonks" | "not-stonks"
}

export function DashboardLayout({ children, variant = "stonks" }: Readonly<DashboardLayoutProps>) {
  return (
    <div
      className={cn(
        "flex h-screen bg-background overflow-hidden",
        {
          "stonks-bg": variant === "stonks",
          "not-stonks-bg": variant === "not-stonks",
        }
      )}
    >
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

        .not-stonks-bg {
          background-image: url('/not-stonks-bg.png'); /* Another image in /public */
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
        }
      `}</style>
    </div>
  )
}
