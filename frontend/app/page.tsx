"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { KpiCard } from "@/components/kpi-card"
import { PriceChart } from "@/components/price-chart"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useApi } from "@/hooks/use-api"
import { itemsApi, categoriesApi } from "@/lib/api-client"
import { usePriceUpdate } from "@/hooks/use-price-update"
import { formatCurrency, formatPercentage } from "@/lib/format-utils"
import {
  Package,
  Tag,
  TrendingUp,
  Clock,
  Loader2,
  RefreshCcw,
  CreditCard,
  DollarSign,
  Wallet,
} from "lucide-react"
import "@/styles/glass.css"

interface Item {
  id: string
  name: string
  buyPrice: number
  minSellPrice?: number | null
  totalNetProfit?: number | null
  percentNetProfit?: number | null
  realizedProfit?: number | null
  sellDate?: string | null
  priceUpdateDate?: string | null
  insertDate: string
  editDate: string
  quantity: number
}

const profitClass = (value: number) =>
  value > 0 ? "text-emerald-500" : value < 0 ? "text-destructive" : "text-foreground"

export default function Home() {
  const { data: items = [], isLoading: itemsLoading, mutate: mutateItems } =
    useApi<Item[]>("items", () => itemsApi.getAll())
  const { data: categories = [], isLoading: categoriesLoading } =
    useApi("categories", () => categoriesApi.getAll())
  const { data: history = [], isLoading: historyLoading, mutate: mutateHistory } =
    useApi("items/history", () => itemsApi.getPortfolioHistory())

  const { isUpdating, updateProgress, processedCount, totalCount, handleUpdatePrices } =
    usePriceUpdate({ onCompleted: () => { mutateItems(); mutateHistory() } })

  // Sold items only count as realized profit
  const activeItems = items.filter((item) => item.sellDate == null)
  const soldItems = items.filter((item) => item.sellDate != null)

  const numberItems = activeItems.length
  const numberCategories = categories.length

  const totalItems = activeItems.reduce((sum, item) => sum + item.quantity, 0)
  const totalSpent = activeItems.reduce((sum, item) => sum + item.buyPrice * item.quantity, 0)
  const totalNetProfit = activeItems.reduce((sum, item) => sum + (item.totalNetProfit || 0), 0)
  const realizedProfit = soldItems.reduce((sum, item) => sum + (item.realizedProfit || 0), 0)
  const profitableItems = activeItems.filter((item) => (item.totalNetProfit || 0) > 0).length

  // Yield weighted by cost, on the items that have a market price
  const pricedSpent = activeItems
    .filter((item) => item.minSellPrice != null)
    .reduce((sum, item) => sum + item.buyPrice * item.quantity, 0)
  const averagePercentage = pricedSpent > 0 ? (totalNetProfit / pricedSpent) * 100 : 0

  const lastPriceSync = activeItems.reduce<Date | null>((latest, item) => {
    if (!item.priceUpdateDate) return latest
    const date = new Date(item.priceUpdateDate)
    return latest && latest > date ? latest : date
  }, null)

  const layoutVariant: "stonks" | "not-stonks" = totalNetProfit < 0 ? "not-stonks" : "stonks"

  return (
    <DashboardLayout variant={layoutVariant}>
      <div className="glass flex flex-col flex-1 min-h-0 h-full overflow-y-auto">
        {/* Header */}
        <div className="glass-panel border-b border-border p-6 mx-6 mt-6">
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
        <div className="flex-1">
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCard
                title="Items"
                description="Number of items held"
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
                description="Net profit on the cost of priced items"
                value={formatPercentage(averagePercentage)}
                icon={<TrendingUp className="w-5 h-5" />}
                isLoading={itemsLoading}
                className="glass-panel"
              />
              <KpiCard
                title="Last price sync"
                description="Last Steam price update"
                value={lastPriceSync ? lastPriceSync.toLocaleString() : "No data available"}
                icon={<Clock className="w-5 h-5" />}
                isLoading={itemsLoading}
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
                      <p className="text-sm text-muted-foreground">Realized Profit</p>
                      <Wallet className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <p className={`text-2xl font-bold ${profitClass(realizedProfit)}`}>
                      {formatCurrency(realizedProfit)}
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
                    <p className={`text-2xl font-bold ${profitClass(averagePercentage)}`}>
                      {formatPercentage(averagePercentage)}
                    </p>
                  </div>
                  <div className="p-4 glass-panel rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm text-muted-foreground">Unrealized Net Profit</p>
                      <DollarSign className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <p className={`text-2xl font-bold ${profitClass(totalNetProfit)}`}>
                      {formatCurrency(totalNetProfit)}
                    </p>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground">
                  Use the <span className="font-semibold">"Update Prices"</span> button to
                  synchronize prices from the Steam Market and update performance indicators.
                  Prices are also updated automatically once a day.
                </p>
              </CardContent>
            </Card>

            <PriceChart
              title="Portfolio History"
              data={history}
              isLoading={historyLoading}
              className="glass-panel"
              series={[
                { key: "totalBuyPrice", name: "Total Spent", color: "var(--color-chart-1)" },
                { key: "totalMinSellPrice", name: "Market Value", color: "var(--color-chart-2)" },
                { key: "totalNetProfit", name: "Unrealized Profit", color: "var(--color-chart-3)" },
                { key: "realizedProfit", name: "Realized Profit", color: "var(--color-chart-4)" },
              ]}
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
