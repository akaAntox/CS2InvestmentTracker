"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { KpiCard } from "@/components/kpi-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useApi } from "@/hooks/use-api"
import { itemsApi, categoriesApi, steamApi } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"
import { formatCurrency, formatPercentage } from "@/lib/format-utils"
import { Activity, TrendingUp, Package, Tag, Loader2 } from "lucide-react"

interface Item {
  id: string
  name: string
  buyPrice: number
  totalNetProfit?: number | null
  percentNetProfit?: number | null
  insertDate: string
  editDate: string
  quantity: number
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

  const numberItems = items?.length || 0
  const numberCategories = categories?.length || 0
  const totalItems = items?.reduce((sum: number, item: Item) => sum + item.quantity, 0) || 0
  const totalSpent = items?.reduce((sum: number, item: Item) => sum + (item.buyPrice * item.quantity), 0) || 0
  const averagePercentage = items?.length
    ? items.reduce((sum: number, item: Item) => sum + (item.percentNetProfit || 0), 0) / items.length
    : 0
  const totalNetProfit = items?.reduce((sum: number, item: Item) => sum + (item.totalNetProfit || 0), 0) || 0
  const lastUpdateDate = items?.length
    ? new Date(
        Math.max(
          ...items.map((item: Item) => {
            const editDate = new Date(item.editDate).getTime()
            const insertDate = new Date(item.insertDate).getTime()
            return Math.max(editDate, insertDate)
          }
        ))
      )
    : null

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
                title="Items"
                description="Number of items in the system"
                value={numberItems}
                icon={<Package className="w-5 h-5" />}
                isLoading={itemsLoading}
              />
              <KpiCard
                title="Categories"
                description="Number of categories in the system"
                value={numberCategories}
                icon={<Tag className="w-5 h-5" />}
                isLoading={categoriesLoading}
              />
              <KpiCard
                title="Average Yield %"
                description="Average yield percentage across items"
                value={formatPercentage(averagePercentage)}
                icon={<Activity className="w-5 h-5" />}
                isLoading={itemsLoading}
              />
              <KpiCard
                title="Last update"
                description="Last Steam price update (last item)"
                value={lastUpdateDate ? lastUpdateDate.toLocaleString() : "N/A"}
                icon={<TrendingUp className="w-5 h-5" />}
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
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-secondary rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Active Items (by quantity)</p>
                    <p className="text-2xl font-bold text-foreground">{totalItems}</p>
                  </div>
                  <div className="p-4 bg-secondary rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Total Spent</p>
                    <p className="text-2xl font-bold text-foreground">{formatCurrency(totalSpent)}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-secondary rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Average Yield %</p>
                    <p className="text-2xl font-bold text-foreground">{formatPercentage(averagePercentage)}</p>
                  </div>
                  <div className="p-4 bg-secondary rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Total Net Profit</p>
                    <p className="text-2xl font-bold text-foreground">{formatCurrency(totalNetProfit)}</p>
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
