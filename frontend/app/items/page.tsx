"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ItemsTable } from "@/components/items-table"
import { Button } from "@/components/ui/button"
import { useApi } from "@/hooks/use-api"
import { useToast } from "@/hooks/use-toast"
import { itemsApi, categoriesApi, steamApi } from "@/lib/api-client"
import { Loader2, Plus } from "lucide-react"
import { ItemDialog } from "@/components/item-dialog"

export default function ItemsPage() {
  const { toast } = useToast()
  const [isUpdating, setIsUpdating] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<any | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)

  const {
    data: items = [],
    isLoading: itemsLoading,
    mutate: mutateItems,
  } = useApi("items-list", () => itemsApi.getAll())

  const { data: categories = [] } = useApi("categories-list", () => categoriesApi.getAll())

  const handleEdit = (item: any) => {
    setSelectedItem(item)
    setEditingId(item.id)
    setDialogOpen(true)
  }

  const handleNew = () => {
    setSelectedItem(null)
    setEditingId(null)
    setDialogOpen(true)
  }

  const handleClose = () => {
    setDialogOpen(false)
    setSelectedItem(null)
    setEditingId(null)
  }

  const handleSubmit = async () => {
    // ricarica la lista e chiudi
    await mutateItems()
    handleClose()
  }

  const handleUpdatePrices = async () => {
    setIsUpdating(true)
    try {
      await steamApi.updateAll()
      toast({
        title: "Successo",
        description: "Prezzi Steam aggiornati con successo",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Error during price update",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background border-b border-border p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Items</h1>
              <p className="text-muted-foreground text-sm mt-1">Complete management of your items</p>
            </div>
            <div className="flex space-x-2">
              <Button onClick={handleUpdatePrices} disabled={isUpdating} className="bg-primary hover:bg-primary/90">
                {isUpdating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Update Prices
              </Button>
              <Button onClick={handleNew} className="bg-accent hover:bg-accent/90">
                <Plus className="w-4 h-4 mr-2" />
                New Item
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          <ItemsTable
            items={items}
            categories={categories}
            isLoading={itemsLoading}
            onEdit={handleEdit}
            onDelete={() => mutateItems()}
            editingId={editingId}
          />
        </div>

        {/* Dialog */}
        <ItemDialog
          open={dialogOpen}
          onOpenChange={(open) => { if (!open) handleClose() }}
          item={selectedItem}
          categories={categories}
          onSubmit={handleSubmit}
        />
      </div>
    </DashboardLayout>
  )
}
