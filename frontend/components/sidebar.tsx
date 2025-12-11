"use client"

import type React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Home, Package, Tag, Calendar, X } from "lucide-react"
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

interface SidebarProps {
  className?: string
  onClose?: () => void // Funzione opzionale per chiudere il menu su mobile
}

export function Sidebar({ className, onClose }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside className={cn("sidebar-glass h-full flex flex-col", className)}>
      {/* Logo/Header */}
      <div className="sidebar-glass-header p-6 mb-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded flex items-center justify-center overflow-hidden bg-white/10">
            {/* Fallback se manca l'immagine, altrimenti usa <img /> */}
            <img src="/logo.png" alt="CS2" className="max-w-full max-h-full object-cover" />
          </div>
          <h1 className="text-lg font-bold truncate">CS2 Inv.</h1>
        </div>
        
        {onClose && (
          <button onClick={onClose} className="md:hidden text-white/70 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-2 space-y-2 overflow-y-auto">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href))

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                "sidebar-link flex items-center gap-3 px-4 py-3 rounded-lg transition-all",
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
      <div className="sidebar-glass-footer p-4 text-xs mt-auto">
        <p className="opacity-50">v1.0.0</p>
      </div>
    </aside>
  )
}