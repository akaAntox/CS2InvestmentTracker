"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { KpiCard } from "@/components/kpi-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useApi } from "@/hooks/use-api"
import { itemsApi, categoriesApi, steamApi } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"
import { formatCurrency } from "@/lib/format-utils"
import { Activity, TrendingUp, Package, Tag, Loader2 } from "lucide-react"

interface Item {
  id: string
  name: string
  price: number
  currentMarketPrice?: number
}

interface Category {
  id: string
  name: string
}

export default function Home() {
  const { toast } = useToast()
  const [isUpdating, setIsUpdating] = useState(false)

  const { data: items = [], isLoading: itemsLoading } = useApi("items", () => itemsApi.getAll())

  const { data: categories = [], isLoading: categoriesLoading } = useApi("categories", () => categoriesApi.getAll())

  const totalItems = items?.length || 0
  const totalCategories = categories?.length || 0
  const averagePrice = items?.length
    ? items.reduce((sum: number, item: Item) => sum + (item.price || 0), 0) / items.length
    : 0

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
        title: "Errore",
        description: "Errore durante l'aggiornamento dei prezzi",
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
              <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
              <p className="text-muted-foreground text-sm mt-1">Benvenuto nel pannello di amministrazione</p>
            </div>
            <Button onClick={handleUpdatePrices} disabled={isUpdating} className="bg-primary hover:bg-primary/90">
              {isUpdating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Aggiorna Prezzi
            </Button>
          </div>
        </div>

        {/* KPI Grid */}
        <div className="flex-1 overflow-auto">
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCard
                title="Articoli Totali"
                description="Numero di articoli nel sistema"
                value={totalItems}
                icon={<Package className="w-5 h-5" />}
                isLoading={itemsLoading}
              />
              <KpiCard
                title="Categorie"
                description="Numero di categorie"
                value={totalCategories}
                icon={<Tag className="w-5 h-5" />}
                isLoading={categoriesLoading}
              />
              <KpiCard
                title="Prezzo Medio"
                description="Media prezzi articoli"
                value={formatCurrency(averagePrice)}
                icon={<TrendingUp className="w-5 h-5" />}
                isLoading={itemsLoading}
              />
              <KpiCard
                title="Ultimi Aggiornamenti"
                description="Da Steam Market API"
                value="--"
                icon={<Activity className="w-5 h-5" />}
                isLoading={false}
              />
            </div>

            {/* Quick Stats Card */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Statistiche Rapide</CardTitle>
                <CardDescription>Panoramica della gestione dati</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-secondary rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Articoli Attivi</p>
                    <p className="text-2xl font-bold text-foreground">{totalItems}</p>
                  </div>
                  <div className="p-4 bg-secondary rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Categorie</p>
                    <p className="text-2xl font-bold text-foreground">{totalCategories}</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Usa il pulsante "Aggiorna Prezzi" per sincronizzare i prezzi da Steam Market.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
