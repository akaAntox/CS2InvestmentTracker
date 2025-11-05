"use client"

import type React from "react"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Home, Package, Tag, Calendar, BarChart3 } from "lucide-react"

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/", icon: <Home className="w-5 h-5" /> },
  { label: "Articoli", href: "/items", icon: <Package className="w-5 h-5" /> },
  { label: "Categorie", href: "/categories", icon: <Tag className="w-5 h-5" /> },
  { label: "Eventi", href: "/events", icon: <Calendar className="w-5 h-5" /> },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
      {/* Logo/Header */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded bg-sidebar-primary flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-sidebar-primary-foreground" />
          </div>
          <h1 className="text-lg font-bold text-sidebar-foreground">Admin</h1>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
            >
              {item.icon}
              <span className="font-medium">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border text-xs text-sidebar-foreground/60">
        <p>v1.0.0</p>
      </div>
    </aside>
  )
}
