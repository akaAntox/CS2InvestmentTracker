"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { KpiCard } from "@/components/kpi-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useApi } from "@/hooks/use-api"
import { itemsApi, categoriesApi, steamApi } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"
import { formatCurrency, formatPercentage } from "@/lib/format-utils"
import * as signalR from "@microsoft/signalr"
import {
  Package,
  Tag,
  TrendingUp,
  Clock,
  Loader2,
  RefreshCcw,
  CreditCard,
  DollarSign,
} from "lucide-react"
import "@/styles/glass.css"

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

export default function Home() {
  const { toast } = useToast()
  const [isUpdating, setIsUpdating] = useState(false)

  // stato per progress & ETA
  const [updateProgress, setUpdateProgress] = useState(0) // 0–100
  const [processedCount, setProcessedCount] = useState<number | null>(null)
  const [totalCount, setTotalCount] = useState<number | null>(null)

  const { data: items = [], isLoading: itemsLoading, mutate: mutateItems } = 
    useApi("items", () => itemsApi.getAll())
  const { data: categories = [], isLoading: categoriesLoading } = 
    useApi("categories", () => categoriesApi.getAll())

  const numberItems = items?.length || 0
  const numberCategories = categories?.length || 0

  const totalItems = items?.reduce((sum: number, item: Item) => sum + item.quantity, 0) || 0
  const totalSpent = items?.reduce((sum: number, item: Item) => sum + item.buyPrice * item.quantity, 0) || 0

  const averagePercentage = items?.length
    ? items.reduce((sum: number, item: Item) => sum + (item.percentNetProfit || 0), 0) /
      items.length
    : 0

  const totalNetProfit = items?.reduce((sum: number, item: Item) => sum + (item.totalNetProfit || 0), 0) || 0

  const profitableItems = items?.filter((item: Item) => (item.totalNetProfit || 0) > 0).length || 0

  const lastUpdateDate = items?.length
    ? new Date(
        Math.max(
          ...items.map((item: Item) => {
            const editDate = new Date(item.editDate).getTime()
            const insertDate = new Date(item.insertDate).getTime()
            return Math.max(editDate, insertDate)
          })
        )
      )
    : null

  const averagePercentageClass =
    averagePercentage > 0
      ? "text-emerald-500"
      : averagePercentage < 0
      ? "text-destructive"
      : "text-foreground"

  const totalNetProfitClass =
    totalNetProfit > 0
      ? "text-emerald-500"
      : totalNetProfit < 0
      ? "text-destructive"
      : "text-foreground"

  const getApiBaseUrl = () => {
    return process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api"
  }

  // effetto che anima la progress bar mentre isUpdating è true
  useEffect(() => {
    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${getApiBaseUrl()}/hubs/priceUpdate`)
      .withAutomaticReconnect()
      .build()

    connection.on("PriceUpdateProgress", (payload: { processed: number; total: number }) => {
      setProcessedCount(payload.processed)
      setTotalCount(payload.total)

      const pct = payload.total > 0 ? (payload.processed / payload.total) * 100 : 0
      setUpdateProgress(pct)
    })

    connection.on("PriceUpdateCompleted", (payload: { total: number }) => {
      setUpdateProgress(100)
      setIsUpdating(false)
      mutateItems()

      toast({
        title: "Update completed",
        description: `Steam prices updated for ${payload.total} items.`,
      })

      // reset progress bar after short delay
      setTimeout(() => {
        setUpdateProgress(0)
        setProcessedCount(null)
        setTotalCount(null)
      }, 1500)
    })

    connection
      .start()
      .catch(err => console.error("SignalR connection error:", err))

    return () => {
      connection.stop()
    }
  }, [mutateItems])

  const handleUpdatePrices = async () => {
    if (isUpdating) return

    setIsUpdating(true)
    setUpdateProgress(0)
    setProcessedCount(null)
    setTotalCount(null)

    try {
      toast({
        title: "Update started",
        description: "Steam prices are being updated. Progress will appear at the top.",
      })

      await steamApi.updateAll()
    } catch (error) {
      setIsUpdating(false)
      toast({
        title: "Error",
        description: "Error starting price update.",
        variant: "destructive",
      })
    }
  }

  return (
    <DashboardLayout>
      <div className="glass dashboard-container flex flex-col h-full">
        {/* Header */}
        <div className="sticky top-0 z-10 glass-panel border-b border-border p-6 mx-6 mt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
              <p className="text-muted-foreground text-sm mt-1">
                Overview of the portfolio and Steam Market price synchronization.
              </p>
            </div>
            <Button
              onClick={handleUpdatePrices}
              disabled={isUpdating}
              className="bg-primary/80 hover:bg-primary"
            >
              {isUpdating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <RefreshCcw className="w-4 h-4 mr-2" />
                  Update Prices
                </>
              )}
            </Button>
          </div>

          {/* Banner di avanzamento update */}
          {isUpdating && (
            <div className="mt-4 rounded-lg border border-border glass-panel p-4 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-foreground">
                  Updating Steam prices…
                </p>
                {totalCount != null && (
                  <p className="text-xs text-muted-foreground">
                    {processedCount ?? 0}/{totalCount} items
                  </p>
                )}
              </div>
              <Progress value={updateProgress} className="h-2" />
              {totalCount != null && (
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Processed: {processedCount ?? 0}</span>
                  <span>Remaining: {totalCount - (processedCount ?? 0)}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* KPI Grid */}
        <div className="flex-1 overflow-auto">
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCard
                title="Items"
                description="Number of registered items"
                value={numberItems}
                icon={<Package className="w-5 h-5" />}
                isLoading={itemsLoading}
                className="glass-panel"
              />
              <KpiCard
                title="Categories"
                description="Available categories"
                value={numberCategories}
                icon={<Tag className="w-5 h-5" />}
                isLoading={categoriesLoading}
                className="glass-panel"
              />
              <KpiCard
                title="Average Yield %"
                description="Average yield on items"
                value={formatPercentage(averagePercentage)}
                icon={<TrendingUp className="w-5 h-5" />}
                isLoading={itemsLoading}
                className="glass-panel"
              />
              <KpiCard
                title="Last update"
                description="Last detected modification/update"
                value={
                  lastUpdateDate
                    ? lastUpdateDate.toLocaleString()
                    : "No data available"
                }
                icon={<Clock className="w-5 h-5" />}
                isLoading={false}
                className="glass-panel"
              />
            </div>

            {/* Quick Stats Card */}
            <Card className="glass-panel border-border">
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
                <CardDescription>
                  Quick summary of quantity, exposure, and net performance.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Prima riga: quantità e spesa */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 glass-panel rounded-lg flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">Active Items (qty)</p>
                      <Package className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <p className="text-2xl font-bold text-foreground">{totalItems}</p>
                  </div>

                  <div className="p-4 glass-panel rounded-lg flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">Total Spent</p>
                      <CreditCard className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <p className="text-2xl font-bold text-foreground">
                      {formatCurrency(totalSpent)}
                    </p>
                  </div>

                  <div className="p-4 glass-panel rounded-lg flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">Profitable Items</p>
                      <TrendingUp className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <p className="text-2xl font-bold text-foreground">
                      {profitableItems}/{numberItems}
                    </p>
                  </div>

                  <div className="p-4 glass-panel rounded-lg flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">Last Update</p>
                      <Clock className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-foreground">
                      {lastUpdateDate
                        ? lastUpdateDate.toLocaleString()
                        : "Nessun dato disponibile"}
                    </p>
                  </div>
                </div>

                {/* Seconda riga: performance */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 glass-panel rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm text-muted-foreground">Average Yield %</p>
                      <TrendingUp className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <p className={`text-2xl font-bold ${averagePercentageClass}`}>
                      {formatPercentage(averagePercentage)}
                    </p>
                  </div>
                  <div className="p-4 glass-panel rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm text-muted-foreground">Total Net Profit</p>
                      <DollarSign className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <p className={`text-2xl font-bold ${totalNetProfitClass}`}>
                      {formatCurrency(totalNetProfit)}
                    </p>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground">
                  Use the <span className="font-semibold">"Update Prices"</span> button to
                  synchronize prices from the Steam Market and update performance indicators.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
