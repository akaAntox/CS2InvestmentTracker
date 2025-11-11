"use client"

import { useState, useMemo } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { formatCurrency, formatDate } from "@/lib/format-utils"
import { itemsApi, ApiError, steamApi } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"
import { Edit, Trash2, RefreshCcw } from "lucide-react"
import { ItemDetailDialog } from "@/components/item-detail-dialog"
import { Dialog } from "@/components/ui/dialog"

interface ItemsTableProps {
  items: any[]
  categories: any[]
  isLoading: boolean
  onDelete: () => void
  onEdit: (item: any) => void
  editingId?: string | null
}

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n))

// bucket con cap a ±1000% e step: 1, 5, 10, 25, 50, 100, 250, 600, 1000
const BUCKETS = [
  { th: 1,   sat: 60, light: 96 },
  { th: 5,   sat: 65, light: 95 },
  { th: 10,  sat: 70, light: 94 },
  { th: 25,  sat: 75, light: 93 },
  { th: 50,  sat: 80, light: 92 },
  { th: 100, sat: 85, light: 91 },
  { th: 250, sat: 88, light: 90 },
  { th: 600, sat: 90, light: 88 },
  { th: 1000, sat: 92, light: 86 }, // -100% / +100% e oltre restano ben visibili
]

function pickBucket(absPct: number) {
  for (const b of BUCKETS) if (absPct <= b.th) return b
  return BUCKETS[BUCKETS.length - 1]
}

/**
 * Pill profit (Net/%): fondo colorato rosso/verde puro con saturazione e lightness a bucket.
 * - Testo sempre scuro per evitare bianco su verde (meglio contrasto).
 * - Lightness minimo 86 per non scurire troppo (−100% ben visibile ma leggibile).
 * - 0% neutro grigio.
 */
function getProfitStyles(percent?: number | null) {
  if (percent === undefined || percent === null || Number.isNaN(percent)) return {}
  const CAP = 1000
  const p = clamp(percent, -CAP, CAP)

  if (p === 0) {
    return {
      backgroundColor: "hsl(210 8% 94%)",
      color: "hsl(210 10% 15%)",
      borderColor: "hsl(210 8% 80%)",
    } as React.CSSProperties
  }

  const abs = Math.abs(p)
  const { sat, light } = pickBucket(abs)
  const hue = p > 0 ? 142 : 0 // verde puro per +, rosso puro per -
  return {
    backgroundColor: `hsl(${hue} ${sat}% ${light}%)`,
    color: "hsl(210 10% 15%)", // testo scuro sempre
    borderColor: `hsl(${hue} ${Math.min(sat + 8, 95)}% ${Math.max(light - 10, 58)}%)`,
  } as React.CSSProperties
}

/**
 * Solo colore del testo per Steam Price vs buy price (per-unit).
 * - Più vicino allo zero: già visibile (sat min 55).
 * - Bucket come sopra, hue rosso/verde puro, lightness fisso scuro per testo.
 */
function getPriceTextColor(deltaPercent?: number | null) {
  if (deltaPercent === undefined || deltaPercent === null || Number.isNaN(deltaPercent)) return {}
  const CAP = 1000
  const p = clamp(deltaPercent, -CAP, CAP)
  if (p === 0) return { color: "hsl(210 8% 30%)" } as React.CSSProperties

  const abs = Math.abs(p)
  const { sat } = pickBucket(abs)
  const hue = p > 0 ? 142 : 0
  const satAdj = Math.max(55, Math.min(sat, 90)) // vicino a 0 resta ben visibile
  const light = 28 // testo scuro su bg chiaro della cella

  return { color: `hsl(${hue} ${satAdj}% ${light}%)` } as React.CSSProperties
}

function formatSigned(n?: number | null, fractionDigits = 2) {
  if (n === undefined || n === null || Number.isNaN(n)) return "--"
  const sign = n > 0 ? "+" : n < 0 ? "−" : "" // typographic minus
  const v = Math.abs(n).toFixed(fractionDigits)
  return `${sign}${v}`
}

export function ItemsTable({
  items,
  categories,
  isLoading,
  onDelete,
  onEdit,
  editingId
}: Readonly<ItemsTableProps>) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [isUpdating, setIsUpdating] = useState<string | null>(null)
  const [detailItem, setDetailItem] = useState<any | null>(null)
  const { toast } = useToast()

  const stop = (e: React.MouseEvent) => e.stopPropagation()

  const filteredItems = useMemo(() => {
    return (items || []).filter((item: any) => {
      const matchesSearch = (item.name ?? "").toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = selectedCategory === "all" || String(item.categoryId) === String(selectedCategory)
      return matchesSearch && matchesCategory
    })
  }, [items, searchTerm, selectedCategory])

  const handleDelete = async (id: string) => {
    setIsDeleting(id)
    try {
      await itemsApi.delete(id)
      toast({ title: "Success", description: "Item deleted" })
      onDelete()
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 409) {
          toast({
            title: "Error",
            description: "Item in use, cannot delete",
            variant: "destructive",
          })
        } else {
          const messages = Object.values(error.errors ?? {}).flat().join(", ")
          toast({
            title: "Error",
            description: messages || "Error during deletion",
            variant: "destructive",
          })
        }
      } else {
        toast({
          title: "Error",
          description: "Something went wrong during deletion",
          variant: "destructive",
        })
      }
    } finally {
      setIsDeleting(null)
    }
  }

  const handleUpdatePrice = async (id: string, name: string) => {
    setIsUpdating(id)
    try {
      await steamApi.updateById(id)
      toast({
        title: "Price updated",
        description: `"${name}" updated from Steam.`,
      })
    } catch (error) {
      if (error instanceof ApiError) {
        const messages = Object.values(error.errors ?? {}).flat().join(", ")
        toast({
          title: "Error updating price",
          description: messages || "Unable to update price from Steam",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Error updating price",
          description: "Something went wrong contacting the Steam API",
          variant: "destructive",
        })
      }
    } finally {
      setIsUpdating(null)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-3">
        <Input
          placeholder="Search items..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1"
        />
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-3 rounded-lg bg-secondary border border-border text-foreground"
        >
          <option value="all">All Categories</option>
          {categories?.map((cat: any) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader className="bg-secondary">
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Quantity</TableHead>
              <TableHead className="text-right" title="Buy Price">Payed</TableHead>
              <TableHead className="text-right">Total Payed</TableHead>
              <TableHead className="text-right" title="Steam Price (from Steam API)">Steam Price</TableHead>
              <TableHead className="text-right" title="Net Profit at -15% tax">Net Profit</TableHead>
              <TableHead className="text-right" title="Total Net Profit at -15% tax">Total Net Profit</TableHead>
              <TableHead className="text-right" title="Yield at -15% tax">Yield</TableHead>
              <TableHead className="text-right">Last Update</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                  No items found.
                </TableCell>
              </TableRow>
            ) : (
              filteredItems.map((item: any) => {
                const category = categories?.find((c) => String(c.id) === String(item.categoryId))
                const isRowUpdating = isUpdating === item.id
                const isRowDeleting = isDeleting === item.id

                const qty = Number(item.quantity ?? 0)
                const buy = Number(item.buyPrice ?? 0) // per-unit
                const totalPayed = qty ? buy * qty : null
                const steam = Number(item.minSellPrice ?? 0) // per-unit
                const currentValue = qty ? steam * qty : null

                const netProfit =
                  typeof item.netProfit === "number"
                    ? item.netProfit
                    : currentValue !== null && totalPayed !== null
                    ? currentValue - totalPayed
                    : null

                const percentNetProfit =
                  typeof item.percentNetProfit === "number"
                    ? item.percentNetProfit
                    : netProfit !== null && totalPayed
                    ? (netProfit / totalPayed) * 100
                    : null

                const totalNetProfit =
                  typeof item.totalNetProfit === "number"
                    ? item.totalNetProfit
                    : null

                const profitCellStyle = getProfitStyles(percentNetProfit ?? null)

                // Steam price text color vs buy price (per-unit)
                let steamDeltaPct: number | null = null
                if (buy > 0 && steam > 0) {
                  steamDeltaPct = ((steam - buy) / buy) * 100
                }
                const steamTextStyle = getPriceTextColor(steamDeltaPct)

                return (
                  <TableRow
                    key={item.id}
                    className="hover:bg-secondary/50 cursor-pointer"
                    onClick={() => setDetailItem(item)}
                  >
                    {/* Name */}
                    <TableCell className="font-medium">{item.name}</TableCell>

                    {/* Category */}
                    <TableCell>
                      <Badge variant="outline">{category?.name || "N/A"}</Badge>
                    </TableCell>

                    {/* Quantity */}
                    <TableCell className="text-right">{qty || "--"}</TableCell>

                    {/* Payed (per unit) */}
                    <TableCell className="text-right">
                      {buy ? formatCurrency(buy) : "--"}
                    </TableCell>

                    {/* Total Payed */}
                    <TableCell className="text-right">
                      {totalPayed ? formatCurrency(totalPayed) : "--"}
                    </TableCell>

                    {/* Steam Price (per unit) with colored text */}
                    <TableCell className="text-right">
                      {steam ? (
                        <span
                          style={steamTextStyle}
                          title={
                            steamDeltaPct === null
                              ? ""
                              : `${formatSigned(steamDeltaPct, 2)}% vs paid`
                          }
                          className="font-medium"
                        >
                          {formatCurrency(steam)}
                        </span>
                      ) : (
                        "--"
                      )}
                    </TableCell>

                    {/* Net Profit (colored pill) */}
                    <TableCell className="text-right">
                      {netProfit === null ? (
                        "--"
                      ) : (
                        <span
                          className="inline-flex items-center justify-end px-2 py-0.5 rounded border text-sm font-medium"
                          style={profitCellStyle}
                          title={
                            percentNetProfit === null ? "" : `${percentNetProfit.toFixed(2)}%`
                          }
                        >
                          {`${netProfit > 0 ? "+" : netProfit < 0 ? "−" : ""}${formatCurrency(Math.abs(netProfit))}`}
                        </span>
                      )}
                    </TableCell>

                    {/* Total Net Profit (colored pill) */}
                    <TableCell className="text-right">
                      {totalNetProfit === null ? (
                        "--"
                      ) : (
                        <span
                          className="inline-flex items-center justify-end px-2 py-0.5 rounded border text-sm font-medium"
                          style={profitCellStyle}
                          title={
                            percentNetProfit === null ? "" : `${percentNetProfit.toFixed(2)}%`
                          }
                        >
                          {`${totalNetProfit > 0 ? "+" : totalNetProfit < 0 ? "−" : ""}${formatCurrency(Math.abs(totalNetProfit))}`}
                        </span>
                      )}
                    </TableCell>

                    {/* % Profit (colored pill) */}
                    <TableCell className="text-right">
                      {percentNetProfit === null ? (
                        "--"
                      ) : (
                        <span
                          className="inline-flex items-center justify-end px-2 py-0.5 rounded border text-sm font-medium tabular-nums"
                          style={profitCellStyle}
                        >
                          {`${formatSigned(percentNetProfit, 2)}%`}
                        </span>
                      )}
                    </TableCell>

                    {/* Last Update */}
                    <TableCell className="text-right text-xs text-muted-foreground">
                      {item.editDate ? formatDate(item.editDate) : formatDate(item.insertDate)}
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right" onClick={stop} onMouseDown={stop}>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          onClick={() => handleUpdatePrice(item.id, item.name)}
                          variant="ghost"
                          size="sm"
                          disabled={isRowUpdating || isRowDeleting}
                          className={isRowUpdating ? "animate-pulse" : undefined}
                          title="Update price from Steam"
                        >
                          <RefreshCcw className={`w-4 h-4 ${isRowUpdating ? "animate-spin" : ""}`} />
                          <span className="sr-only">Update price</span>
                        </Button>

                        <Button
                          onClick={() => onEdit(item)}
                          disabled={editingId === item.id || isRowUpdating || isRowDeleting}
                          variant="ghost"
                          size="sm"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              disabled={isRowUpdating || isRowDeleting}
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogTitle>Delete Item</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{item.name}"? This action cannot be undone.
                            </AlertDialogDescription>
                            <div className="flex gap-2">
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(item.id)}
                                disabled={isRowDeleting}
                                className="bg-destructive hover:bg-destructive/90"
                              >
                                {isRowDeleting ? "Deleting..." : "Delete"}
                              </AlertDialogAction>
                            </div>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* DETAIL DIALOG */}
      <ItemDetailDialog
        open={!!detailItem}
        onOpenChange={(v) => !v && setDetailItem(null)}
        item={detailItem}
        categories={categories}
      />
    </div>
  )
}
