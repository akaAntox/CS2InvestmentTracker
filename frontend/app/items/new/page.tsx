"use client"

import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ItemForm } from "@/components/item-form"
import { useApi } from "@/hooks/use-api"
import { categoriesApi } from "@/lib/api-client"
import { ChevronLeft } from "lucide-react"
import Link from "next/link"

export default function NewItemPage() {
  const router = useRouter()

  const { data: categories = [] } = useApi("categories-for-item", () => categoriesApi.getAll())

  return (
    <DashboardLayout>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background border-b border-border p-6">
          <div className="flex items-center gap-3">
            <Link href="/items" className="text-muted-foreground hover:text-foreground">
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-foreground">New Item</h1>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-2xl">
            <ItemForm categories={categories} onSubmit={() => router.push("/items")} onCancel={() => router.back()} />
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
