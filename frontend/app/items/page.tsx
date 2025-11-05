"use client"

import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ItemsTable } from "@/components/items-table"
import { Button } from "@/components/ui/button"
import { useApi } from "@/hooks/use-api"
import { itemsApi, categoriesApi } from "@/lib/api-client"
import { Plus } from "lucide-react"

export default function ItemsPage() {
  const router = useRouter()

  const {
    data: items = [],
    isLoading: itemsLoading,
    mutate: mutateItems,
  } = useApi("items-list", () => itemsApi.getAll())

  const { data: categories = [] } = useApi("categories-list", () => categoriesApi.getAll())

  return (
    <DashboardLayout>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background border-b border-border p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Articoli</h1>
              <p className="text-muted-foreground text-sm mt-1">Gestione completa dei tuoi articoli</p>
            </div>
            <Button onClick={() => router.push("/items/new")} className="bg-accent hover:bg-accent/90">
              <Plus className="w-4 h-4 mr-2" />
              Nuovo Articolo
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          <ItemsTable items={items} categories={categories} isLoading={itemsLoading} onDelete={() => mutateItems()} />
        </div>
      </div>
    </DashboardLayout>
  )
}
