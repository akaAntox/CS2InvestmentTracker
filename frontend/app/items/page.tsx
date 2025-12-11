"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ItemsTable } from "@/components/items/items-table"
import { Button } from "@/components/ui/button"
import { useApi } from "@/hooks/use-api"
import { useToast } from "@/hooks/use-toast"
import { itemsApi, categoriesApi, steamApi } from "@/lib/api-client"
import { Loader2, Plus, RefreshCcw } from "lucide-react"
import { ItemDialog } from "@/components/items/item-dialog"
import "@/styles/glass.css"

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

  const { data: categories = [] } = useApi("categories-list", () => 
    categoriesApi.getAll().then((cats) => 
      cats.toSorted((a, b) => a.name.localeCompare(b.name))
    )
  )

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
    // reload list and close dialog
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
      {/* Root page container must fill and hide outer scroll */}
      <div className="glass flex flex-col flex-1 min-h-0 overflow-hidden">
        {/* Header - MODIFICATO PER RESPONSIVENESS */}
        <div className="glass-panel border-b border-border p-6 mx-6 mt-6">
          {/* Flexbox principale con adattamento al wrapping */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            {/* Blocco titolo e descrizione (sempre visibile) */}
            <div className="mb-4 md:mb-0"> {/* Aggiunge margine in basso su schermi piccoli */}
              <h1 className="text-3xl font-bold text-foreground">Items</h1>
              <p className="text-muted-foreground text-sm mt-1">
                Complete management of your items
              </p>
            </div>
            
            {/* Blocco pulsanti: flex-col su schermi piccoli, flex-row su schermi medi e oltre */}
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
              <Button
                onClick={handleUpdatePrices}
                disabled={isUpdating}
                className="bg-primary hover:bg-primary/90 w-full sm:w-auto" // Rende il pulsante a larghezza intera su schermi molto piccoli
              >
                {isUpdating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCcw className="w-4 h-4 mr-2" />}
                <span className="hidden sm:inline">Update Prices</span> {/* Nasconde il testo su schermi molto piccoli */}
                <span className="sm:hidden">Update</span> {/* Mostra testo più corto su schermi molto piccoli */}
              </Button>
              <Button onClick={handleNew} className="bg-accent hover:bg-accent/90 w-full sm:w-auto">
                <Plus className="w-4 h-4 mr-2" />
                New Item
              </Button>
            </div>
          </div>
        </div>

        {/* Content area: fills remaining height, no external scroll */}
        <div className="flex-1 min-h-0 p-6 overflow-hidden">
          <ItemsTable
            items={items}
            categories={categories}
            isLoading={itemsLoading}
            onEdit={handleEdit}
            onPriceUpdate={mutateItems}
            onDelete={mutateItems}
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