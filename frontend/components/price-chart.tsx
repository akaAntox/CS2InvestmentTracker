"use client"

import { useMemo } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface PriceData {
  date: string
  buyPrice: number
  minSellPrice?: number
}

interface PriceChartProps {
  data?: PriceData[]
  isLoading?: boolean
  title?: string
  height?: number
}

export function PriceChart({
  data = [],
  isLoading = false,
  title = "Andamento Prezzi",
  height = 300,
}: Readonly<PriceChartProps>) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return []

    return data.map((item: any) => ({
      date: new Date(item.trackDate || item.date).toLocaleDateString("it-IT", {
        month: "short",
        day: "numeric",
      }),
      buyPrice: Number.parseFloat(item.buyPrice?.toString() || "0"),
      minSellPrice:
        item.minSellPrice || item.minSellPrice
          ? Number.parseFloat((item.minSellPrice || item.minSellPrice)?.toString() || "0")
          : null,
    }))
  }, [data])

  const hasData = chartData.length > 0

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{hasData ? "Visualizzazione storica dei prezzi" : "Nessun dato disponibile"}</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-80 flex items-center justify-center text-muted-foreground">Caricamento dati...</div>
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
                formatter={(value) => `€${Number.parseFloat(value).toFixed(2)}`}
              />
              <Legend
                wrapperStyle={{
                  color: "var(--color-foreground)",
                }}
              />
              <Line
                type="monotone"
                dataKey="buyPrice"
                stroke="var(--color-chart-1)"
                name="Prezzo Base"
                strokeWidth={2}
                dot={{ fill: "var(--color-chart-1)", r: 4 }}
              />
              {chartData.some((d: any) => d.minSellPrice) && (
                <Line
                  type="monotone"
                  dataKey="minSellPrice"
                  stroke="var(--color-chart-2)"
                  name="Prezzo Minimo di Vendita"
                  strokeWidth={2}
                  dot={{ fill: "var(--color-chart-2)", r: 4 }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-80 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <p>Nessun dato disponibile</p>
              <p className="text-xs mt-2">I dati storici verranno visualizzati quando disponibili</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
