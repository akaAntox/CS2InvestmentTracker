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
  minSellPrice: number
  minSellPrice?: number
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
    ? items.reduce((sum: number, item: Item) => sum + (item.minSellPrice || 0), 0) / items.length
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
              <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
              <p className="text-muted-foreground text-sm mt-1">Welcome to the admin panel</p>
            </div>
            <Button onClick={handleUpdatePrices} disabled={isUpdating} className="bg-primary hover:bg-primary/90">
              {isUpdating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Update Prices
            </Button>
          </div>
        </div>

        {/* KPI Grid */}
        <div className="flex-1 overflow-auto">
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCard
                title="Total Items"
                description="Number of items in the system"
                value={totalItems}
                icon={<Package className="w-5 h-5" />}
                isLoading={itemsLoading}
              />
              <KpiCard
                title="Categories"
                description="Number of categories"
                value={totalCategories}
                icon={<Tag className="w-5 h-5" />}
                isLoading={categoriesLoading}
              />
              <KpiCard
                title="Average Price"
                description="Average item prices"
                value={formatCurrency(averagePrice)}
                icon={<TrendingUp className="w-5 h-5" />}
                isLoading={itemsLoading}
              />
              <KpiCard
                title="Latest Updates"
                description="From Steam Market API"
                value="--"
                icon={<Activity className="w-5 h-5" />}
                isLoading={false}
              />
            </div>

            {/* Quick Stats Card */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
                <CardDescription>Overview of data management</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-secondary rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Active Items</p>
                    <p className="text-2xl font-bold text-foreground">{totalItems}</p>
                  </div>
                  <div className="p-4 bg-secondary rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Categories</p>
                    <p className="text-2xl font-bold text-foreground">{totalCategories}</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Use the "Update Prices" button to sync prices from Steam Market.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
