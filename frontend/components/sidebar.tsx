"use client"

import type React from "react"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Home, Package, Tag, Calendar } from "lucide-react"
import "@/styles/glass.css"

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/", icon: <Home className="w-5 h-5" /> },
  { label: "Items", href: "/items", icon: <Package className="w-5 h-5" /> },
  { label: "Categories", href: "/categories", icon: <Tag className="w-5 h-5" /> },
  { label: "Events", href: "/events", icon: <Calendar className="w-5 h-5" /> },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="sidebar-glass fixed left-0 top-0 h-screen w-64 flex flex-col">
      {/* Logo/Header */}
      <div className="sidebar-glass-header p-6 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded flex items-center justify-center overflow-hidden">
            <img src="/logo.png" alt="CS2" className="max-w-full max-h-full" />
          </div>
          <h1 className="text-lg font-bold">CS2 Investment</h1>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-2 space-y-2">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href))

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "sidebar-link flex items-center gap-3 px-4 py-3",
                isActive && "sidebar-link-active"
              )}
            >
              {item.icon}
              <span className="font-medium">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="sidebar-glass-footer p-4 text-xs">
        <p>v1.0.0</p>
      </div>
    </aside>
  )
}
