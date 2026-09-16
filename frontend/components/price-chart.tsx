"use client"

import { useMemo, useState } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/format-utils"
import { cn } from "@/lib/utils"

export interface ChartSeries {
  key: string
  name: string
  color: string
}

const PRICE_SERIES: ChartSeries[] = [
  { key: "buyPrice", name: "Buy Price", color: "var(--color-chart-1)" },
  { key: "minSellPrice", name: "Min Sell Price", color: "var(--color-chart-2)" },
]

const RANGES = [
  { label: "30D", days: 30 },
  { label: "90D", days: 90 },
  { label: "1Y", days: 365 },
  { label: "All", days: null },
]

interface PriceChartProps {
  /** Rows with a `date` field plus one numeric field per series */
  data?: Record<string, any>[]
  series?: ChartSeries[]
  isLoading?: boolean
  title?: string
  height?: number
  className?: string
}

export function PriceChart({
  data = [],
  series = PRICE_SERIES,
  isLoading = false,
  title = "Price History",
  height = 300,
  className,
}: Readonly<PriceChartProps>) {
  const [days, setDays] = useState<number | null>(null)

  const chartData = useMemo(() => {
    const cutoff = days === null ? null : Date.now() - days * 86_400_000
    return data
      .filter((row) => cutoff === null || new Date(row.date).getTime() >= cutoff)
      .map((row): Record<string, any> => ({
        ...row,
        date: new Date(row.date).toLocaleDateString("it-IT", { day: "numeric", month: "short", year: "2-digit" }),
      }))
  }, [data, days])

  const visibleSeries = series.filter((s) => chartData.some((row) => row[s.key] != null))
  const hasData = visibleSeries.length > 0

  return (
    <Card className={cn("bg-card border-border", className)}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{hasData ? "Daily snapshot history" : "No data available"}</CardDescription>
        <CardAction className="flex gap-1">
          {RANGES.map((range) => (
            <Button
              key={range.label}
              type="button"
              size="sm"
              variant={days === range.days ? "secondary" : "ghost"}
              onClick={() => setDays(range.days)}
            >
              {range.label}
            </Button>
          ))}
        </CardAction>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div style={{ height }} className="flex items-center justify-center text-muted-foreground">Loading data...</div>
        ) : hasData ? (
          <ResponsiveContainer width="100%" height={height}>
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="date" stroke="var(--color-muted-foreground)" />
              <YAxis stroke="var(--color-muted-foreground)" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--color-card)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "8px",
                  color: "var(--color-foreground)",
                }}
                formatter={(value: any) => formatCurrency(Number(value))}
              />
              <Legend
                wrapperStyle={{
                  color: "var(--color-foreground)",
                }}
              />
              {visibleSeries.map((s) => (
                <Line
                  key={s.key}
                  type="monotone"
                  dataKey={s.key}
                  stroke={s.color}
                  name={s.name}
                  strokeWidth={2}
                  dot={chartData.length <= 31}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ height }} className="flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <p>No data available</p>
              <p className="text-xs mt-2">History fills up with one snapshot per day after each price update</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
