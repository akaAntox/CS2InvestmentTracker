"use client"

import type React from "react"
import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { cn } from "@/lib/utils"
import { Menu } from "lucide-react"

interface DashboardLayoutProps {
  children: React.ReactNode
  variant?: "stonks" | "not-stonks"
}

export function DashboardLayout({ children, variant = "stonks" }: Readonly<DashboardLayoutProps>) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <div
      className={cn(
        "flex h-screen bg-background overflow-hidden relative",
        {
          "stonks-bg": variant === "stonks",
          "not-stonks-bg": variant === "not-stonks",
        }
      )}
    >
      {/* 1. DESKTOP SIDEBAR */}
      <div className="hidden md:flex fixed left-0 top-0 bottom-0 w-64 z-10">
        <Sidebar className="w-full" />
      </div>

      {/* 2. MOBILE OVERLAY & SIDEBAR */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
      
      {/* La Sidebar Mobile vera e propria */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out md:hidden",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <Sidebar onClose={() => setIsMobileMenuOpen(false)} />
      </div>

      {/* 3. MAIN CONTENT */}
      <main className="flex-1 md:ml-64 flex flex-col min-h-0 overflow-hidden relative w-full">
        
        {/* MOBILE HEADER */}
        <header className="md:hidden flex items-center p-4 h-16 border-b border-white/10 backdrop-blur-md bg-black/20 z-30">
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 -ml-2 rounded-md hover:bg-white/10 text-white"
          >
            <Menu className="w-6 h-6" />
          </button>
          <span className="ml-4 font-bold text-lg text-white">CS2 Investment</span>
        </header>

        {/* Contenuto Pagina Scrollabile */}
        <div className="flex-1 overflow-y-auto overflow-hidden">
          {children}
        </div>
      </main>

      <style jsx>{`
        .stonks-bg {
          background-image: url('/stonks-bg.png');
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
        }

        .not-stonks-bg {
          background-image: url('/not-stonks-bg.png');
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
        }
      `}</style>
    </div>
  )
}