"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { CategoriesTable } from "@/components/categories-table"
import { CategoryDialog } from "@/components/category-dialog"
import { Button } from "@/components/ui/button"
import { useApi } from "@/hooks/use-api"
import { categoriesApi } from "@/lib/api-client"
import { Plus } from "lucide-react"

export default function CategoriesPage() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<any>(null)

  const { data: categories = [], isLoading, mutate } = useApi("categories", () => categoriesApi.getAll())

  const handleEdit = (category: any) => {
    setSelectedCategory(category)
    setDialogOpen(true)
  }

  const handleDialogClose = () => {
    setDialogOpen(false)
    setSelectedCategory(null)
  }

  const handleSubmit = () => {
    mutate()
    handleDialogClose()
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background border-b border-border p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Categorie</h1>
              <p className="text-muted-foreground text-sm mt-1">Gestione delle categorie prodotto</p>
            </div>
            <Button
              onClick={() => {
                setSelectedCategory(null)
                setDialogOpen(true)
              }}
              className="bg-accent hover:bg-accent/90"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nuova Categoria
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          <CategoriesTable
            categories={categories}
            isLoading={isLoading}
            onEdit={handleEdit}
            onDelete={() => mutate()}
          />
        </div>

        {/* Dialog */}
        <CategoryDialog
          open={dialogOpen}
          onOpenChange={handleDialogClose}
          category={selectedCategory}
          onSubmit={handleSubmit}
        />
      </div>
    </DashboardLayout>
  )
}
