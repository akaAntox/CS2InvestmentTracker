"use client"

import { useMemo, useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { categoriesApi, ApiError } from "@/lib/api-client"
import { formatCurrency, formatPercentage } from "@/lib/format-utils"
import { useToast } from "@/hooks/use-toast"
import { Edit, Trash2, ChevronUp, ChevronDown, Package, TrendingUp, TrendingDown, Trophy, AlertTriangle } from "lucide-react"
import "@/styles/glass.css"
import { cn } from "@/lib/utils"
import type { CategorySummary } from "@/lib/types"

interface CategoriesTableProps {
  categories: any[]
  summaries: CategorySummary[]
  isLoading: boolean
  onEdit: (category: any) => void
  onDelete: () => void
  editingId?: string | null
}

type SortDir = "asc" | "desc" | null
type SortKey = "name" | "description" | "itemCount" | "totalBuyPrice" | "totalMinSellPrice" | "totalNetProfit" | "averagePercentProfit"

function sortIcon(dir: SortDir) {
  if (dir === "asc") return <ChevronUp className="ml-1 h-4 w-4 inline-block" />
  if (dir === "desc") return <ChevronDown className="ml-1 h-4 w-4 inline-block" />
  return null
}

function getProfitColor(value: number | null | undefined): string {
  if (value === null || value === undefined) return "text-muted-foreground"
  if (value > 0) return "text-emerald-400"
  if (value < 0) return "text-red-400"
  return "text-muted-foreground"
}

function getProfitBg(value: number | null | undefined): string {
  if (value === null || value === undefined) return ""
  if (value > 0) return "bg-emerald-500/10 border-emerald-500/20"
  if (value < 0) return "bg-red-500/10 border-red-500/20"
  return ""
}

export function CategoriesTable({
  categories,
  summaries,
  isLoading,
  onEdit,
  onDelete,
  editingId,
}: Readonly<CategoriesTableProps>) {
  const [searchTerm, setSearchTerm] = useState("")
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const { toast } = useToast()

  const [sortKey, setSortKey] = useState<SortKey>("name")
  const [sortDir, setSortDir] = useState<SortDir>("asc")

  // Merge categories with their summaries
  const mergedCategories = useMemo(() => {
    const summaryMap = new Map<number, CategorySummary>()
    for (const s of summaries) {
      summaryMap.set(s.id, s)
    }
    return (categories || []).map((cat: any) => ({
      ...cat,
      summary: summaryMap.get(cat.id) ?? null,
    }))
  }, [categories, summaries])

  const filteredCategories = useMemo(
    () =>
      mergedCategories.filter((cat: any) =>
        (cat.name ?? "").toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    [mergedCategories, searchTerm],
  )

  const sortedCategories = useMemo(() => {
    if (!sortDir || !sortKey) return filteredCategories

    const arr = [...filteredCategories]
    arr.sort((a, b) => {
      const getVal = (item: any) => {
        const s = item.summary
        switch (sortKey) {
          case "name": return (item.name ?? "").toString().toLowerCase()
          case "description": return (item.description ?? "").toString().toLowerCase()
          case "itemCount": return s?.itemCount ?? -Infinity
          case "totalBuyPrice": return s?.totalBuyPrice ?? -Infinity
          case "totalMinSellPrice": return s?.totalMinSellPrice ?? -Infinity
          case "totalNetProfit": return s?.totalNetProfit ?? -Infinity
          case "averagePercentProfit": return s?.averagePercentProfit ?? -Infinity
        }
      }
      const av = getVal(a)
      const bv = getVal(b)
      if (av === bv) return 0
      if (av === undefined || av === null) return 1
      if (bv === undefined || bv === null) return -1
      return av > bv ? 1 : -1
    })

    if (sortDir === "desc") arr.reverse()
    return arr
  }, [filteredCategories, sortKey, sortDir])

  const toggleSort = (key: SortKey) => {
    if (sortKey !== key) {
      setSortKey(key)
      setSortDir("asc")
      return
    }
    setSortDir((d) => (d === "asc" ? "desc" : d === "desc" ? null : "asc"))
  }

  const handleDelete = async (id: string) => {
    setIsDeleting(id)
    try {
      await categoriesApi.delete(id)
      toast({ title: "Success", description: "Category deleted" })
      onDelete()
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 409) {
          toast({
            title: "Error",
            description: "Category in use, unable to delete",
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

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    )
  }

  const SortableHead = ({ label, k, alignRight, className, title }: { label: string; k: SortKey; alignRight?: boolean; className?: string; title?: string }) => (
    <TableHead className={cn(alignRight ? "text-right" : "", className)} title={title}>
      <button
        type="button"
        onClick={() => toggleSort(k)}
        className="inline-flex items-center select-none hover:underline"
      >
        <span>{label}</span>
        {sortKey === k ? sortIcon(sortDir) : null}
      </button>
    </TableHead>
  )

  return (
    <TooltipProvider delayDuration={300}>
      <div className="glass flex flex-col h-full min-h-0 space-y-4">
        {/* Filters */}
        <div className="flex gap-3 rounded-lg">
          <Input
            placeholder="Search categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 glass-tile border-r border-border"
          />
        </div>

        {/* Table wrapper */}
        <div className="glass-table rounded-lg flex-1 min-h-0 overflow-hidden">
          <div className="overflow-x-auto h-full w-full">
            <div className="h-full overflow-y-auto">
              <Table className="min-w-full glass-panel">
                <TableHeader className="sticky top-0 z-20 glass-tile-head-table border-r text-right">
                  <TableRow>
                    <SortableHead label="Name" k="name" />
                    <SortableHead label="Description" k="description" className="hidden sm:table-cell" />
                    <SortableHead label="Items" k="itemCount" alignRight className="hidden md:table-cell" title="Number of items" />
                    <SortableHead label="Invested" k="totalBuyPrice" alignRight className="hidden lg:table-cell" title="Total buy price" />
                    <SortableHead label="Value" k="totalMinSellPrice" alignRight className="hidden lg:table-cell" title="Total current value" />
                    <SortableHead label="Profit" k="totalNetProfit" alignRight title="Total net profit" />
                    <SortableHead label="Avg %" k="averagePercentProfit" alignRight className="hidden xl:table-cell" title="Average profit %" />
                    <TableHead className="text-right hidden xl:table-cell">Best / Worst</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {sortedCategories.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={9}
                        className="text-center py-8 text-muted-foreground"
                      >
                        No categories found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    sortedCategories.map((category: any) => {
                      const isRowDeleting = isDeleting === category.id
                      const s: CategorySummary | null = category.summary

                      return (
                        <TableRow key={category.id} className="glass-table-row">
                          {/* Name */}
                          <TableCell className="font-medium align-top">
                            <div className="flex flex-col">
                              <span>{category.name}</span>
                              {category.description && (
                                <span className="text-xs text-muted-foreground sm:hidden mt-0.5 line-clamp-2">
                                  {category.description}
                                </span>
                              )}
                              {/* Show item count badge on mobile */}
                              {s && s.itemCount > 0 && (
                                <span className="md:hidden text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                                  <Package className="w-3 h-3" />
                                  {s.itemCount} items
                                </span>
                              )}
                            </div>
                          </TableCell>

                          {/* Description */}
                          <TableCell className="text-muted-foreground hidden sm:table-cell align-middle max-w-[200px] truncate">
                            {category.description || "--"}
                          </TableCell>

                          {/* Item Count */}
                          <TableCell className="text-right hidden md:table-cell align-middle">
                            {s ? (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="inline-flex items-center gap-1.5 text-foreground">
                                    <Package className="w-3.5 h-3.5 text-muted-foreground" />
                                    {s.itemCount}
                                    {s.totalQuantity > s.itemCount && (
                                      <span className="text-xs text-muted-foreground">
                                        ({s.totalQuantity} qty)
                                      </span>
                                    )}
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent className="glass-dialog">
                                  <p>{s.itemCount} unique items, {s.totalQuantity} total quantity</p>
                                </TooltipContent>
                              </Tooltip>
                            ) : (
                              <span className="text-muted-foreground">0</span>
                            )}
                          </TableCell>

                          {/* Total Buy Price (Invested) */}
                          <TableCell className="text-right hidden lg:table-cell align-middle">
                            {s && s.totalBuyPrice > 0 ? (
                              <span className="text-foreground font-medium tabular-nums">
                                {formatCurrency(s.totalBuyPrice)}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">--</span>
                            )}
                          </TableCell>

                          {/* Total Min Sell Price (Value) */}
                          <TableCell className="text-right hidden lg:table-cell align-middle">
                            {s?.totalMinSellPrice != null ? (
                              <span className={cn("font-medium tabular-nums", getProfitColor(
                                s.totalMinSellPrice - s.totalBuyPrice
                              ))}>
                                {formatCurrency(s.totalMinSellPrice)}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">--</span>
                            )}
                          </TableCell>

                          {/* Total Net Profit */}
                          <TableCell className="text-right align-middle">
                            {s?.totalNetProfit != null ? (
                              <span className={cn(
                                "inline-flex items-center justify-end gap-1 px-2 py-0.5 rounded border text-sm font-medium tabular-nums",
                                getProfitBg(s.totalNetProfit),
                                getProfitColor(s.totalNetProfit),
                              )}>
                                {s.totalNetProfit > 0 ? (
                                  <TrendingUp className="w-3.5 h-3.5" />
                                ) : s.totalNetProfit < 0 ? (
                                  <TrendingDown className="w-3.5 h-3.5" />
                                ) : null}
                                {s.totalNetProfit > 0 ? "+" : s.totalNetProfit < 0 ? "−" : ""}
                                {formatCurrency(Math.abs(s.totalNetProfit))}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">--</span>
                            )}
                          </TableCell>

                          {/* Average % Profit */}
                          <TableCell className="text-right hidden xl:table-cell align-middle">
                            {s?.averagePercentProfit != null ? (
                              <span className={cn(
                                "inline-flex items-center justify-end px-2 py-0.5 rounded border text-sm font-medium tabular-nums",
                                getProfitBg(s.averagePercentProfit),
                                getProfitColor(s.averagePercentProfit),
                              )}>
                                {s.averagePercentProfit > 0 ? "+" : ""}
                                {formatPercentage(s.averagePercentProfit)}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">--</span>
                            )}
                          </TableCell>

                          {/* Best / Worst */}
                          <TableCell className="text-right hidden xl:table-cell align-middle">
                            {s && (s.bestItem || s.worstItem) ? (
                              <div className="flex flex-col items-end gap-0.5">
                                {s.bestItem && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span className="inline-flex items-center gap-1 text-xs text-emerald-400 max-w-[140px] truncate">
                                        <Trophy className="w-3 h-3 shrink-0" />
                                        {s.bestItem}
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent className="glass-dialog">
                                      <p>Best performer: {s.bestItem}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                )}
                                {s.worstItem && s.worstItem !== s.bestItem && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span className="inline-flex items-center gap-1 text-xs text-red-400 max-w-[140px] truncate">
                                        <AlertTriangle className="w-3 h-3 shrink-0" />
                                        {s.worstItem}
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent className="glass-dialog">
                                      <p>Worst performer: {s.worstItem}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">--</span>
                            )}
                          </TableCell>

                          {/* Actions */}
                          <TableCell className="text-right align-middle">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                onClick={() => onEdit(category)}
                                disabled={editingId === category.id || isRowDeleting}
                                variant="ghost"
                                size="sm"
                                className={cn(
                                  "btn-glass-ghost",
                                  isRowDeleting && "animate-pulse",
                                )}
                                title="Edit"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>

                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className={cn(
                                      "btn-glass-ghost",
                                      isRowDeleting && "animate-pulse",
                                    )}
                                    disabled={isRowDeleting}
                                    title="Delete"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="glass-dialog">
                                  <AlertDialogTitle>Delete Category</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete &quot;{category.name}
                                    &quot;? This action cannot be undone.
                                  </AlertDialogDescription>
                                  <div className="flex gap-2 justify-end mt-4">
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDelete(category.id)}
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
          </div>
        </div>

        {/* Footer with totals */}
        {summaries.length > 0 && (
          <div className="glass-panel flex flex-wrap items-center justify-between gap-3 text-sm px-4 py-3 rounded-lg">
            <div className="text-muted-foreground">
              <strong>{sortedCategories.length}</strong> categories · <strong>{summaries.reduce((acc, s) => acc + s.itemCount, 0)}</strong> total items
            </div>
            <div className="flex items-center gap-4">
              <span className="text-muted-foreground">
                Invested: <strong className="text-foreground">{formatCurrency(summaries.reduce((acc, s) => acc + s.totalBuyPrice, 0))}</strong>
              </span>
              {(() => {
                const totalProfit = summaries.reduce((acc, s) => acc + (s.totalNetProfit ?? 0), 0)
                return (
                  <span className={cn("font-medium", getProfitColor(totalProfit))}>
                    Profit: {totalProfit > 0 ? "+" : totalProfit < 0 ? "−" : ""}{formatCurrency(Math.abs(totalProfit))}
                  </span>
                )
              })()}
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}