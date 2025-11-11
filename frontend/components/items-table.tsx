"use client"

import { useState, useMemo, useRef, useEffect } from "react"
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
import { Edit, Trash2, RefreshCcw, ChevronUp, ChevronDown } from "lucide-react"
import { ItemDetailDialog } from "@/components/item-detail-dialog"

interface ItemsTableProps {
  items: any[]
  categories: any[]
  isLoading: boolean
  onDelete: () => void
  onEdit: (item: any) => void
  editingId?: string | null
}

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n))

// === Config: scegli paginazione oppure chunk scroll ===
const CHUNK_SCROLL = false // => true per caricare a "blocchi" mentre scorri

// bucket con cap a ±1000% e step
const BUCKETS = [
  { th: 1,   sat: 60, light: 96 },
  { th: 5,   sat: 65, light: 95 },
  { th: 10,  sat: 70, light: 94 },
  { th: 25,  sat: 75, light: 93 },
  { th: 50,  sat: 80, light: 92 },
  { th: 100, sat: 85, light: 91 },
  { th: 250, sat: 88, light: 90 },
  { th: 600, sat: 90, light: 88 },
  { th: 1000, sat: 92, light: 86 },
]

function pickBucket(absPct: number) {
  for (const b of BUCKETS) if (absPct <= b.th) return b
  return BUCKETS[BUCKETS.length - 1]
}

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
  const hue = p > 0 ? 142 : 0
  return {
    backgroundColor: `hsl(${hue} ${sat}% ${light}%)`,
    color: "hsl(210 10% 15%)",
    borderColor: `hsl(${hue} ${Math.min(sat + 8, 95)}% ${Math.max(light - 10, 58)}%)`,
  } as React.CSSProperties
}

function getPriceTextColor(deltaPercent?: number | null) {
  if (deltaPercent === undefined || deltaPercent === null || Number.isNaN(deltaPercent)) return {}
  const CAP = 1000
  const p = clamp(deltaPercent, -CAP, CAP)
  if (p === 0) return { color: "hsl(210 8% 30%)" } as React.CSSProperties

  const abs = Math.abs(p)
  const { sat } = pickBucket(abs)
  const hue = p > 0 ? 142 : 0
  const satAdj = Math.max(55, Math.min(sat, 90))
  const light = 28
  return { color: `hsl(${hue} ${satAdj}% ${light}%)` } as React.CSSProperties
}

function formatSigned(n?: number | null, fractionDigits = 2) {
  if (n === undefined || n === null || Number.isNaN(n)) return "--"
  const sign = n > 0 ? "+" : n < 0 ? "−" : ""
  const v = Math.abs(n).toFixed(fractionDigits)
  return `${sign}${v}`
}

// === Sorting helpers ===
type SortDir = "asc" | "desc" | null
type SortKey =
  | "name" | "category" | "quantity" | "buy" | "totalPayed" | "steam" | "netProfit" | "totalNetProfit" | "percentNetProfit" | "lastUpdate"

function sortIcon(dir: SortDir) {
  if (dir === "asc") return <ChevronUp className="ml-1 h-4 w-4 inline-block" />
  if (dir === "desc") return <ChevronDown className="ml-1 h-4 w-4 inline-block" />
  return null
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

  // sorting state
  const [sortKey, setSortKey] = useState<SortKey>("lastUpdate")
  const [sortDir, setSortDir] = useState<SortDir>("desc")

  // pagination state
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)

  // chunk scroll state
  const CHUNK_SIZE = 50
  const [visibleCount, setVisibleCount] = useState(CHUNK_SIZE)
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!CHUNK_SCROLL) return
    setVisibleCount(CHUNK_SIZE) // reset quando filtri/sort cambiano (vedi deps più sotto)
  }, [CHUNK_SCROLL, searchTerm, selectedCategory, sortKey, sortDir])

  useEffect(() => {
    if (!CHUNK_SCROLL) return
    const el = sentinelRef.current
    if (!el) return
    const obs = new IntersectionObserver((entries) => {
      const first = entries[0]
      if (first.isIntersecting) {
        setVisibleCount((c) => c + CHUNK_SIZE)
      }
    }, { rootMargin: "200px" })
    obs.observe(el)
    return () => obs.disconnect()
  }, [CHUNK_SCROLL])

  const stop = (e: React.MouseEvent) => e.stopPropagation()

  const filtered = useMemo(() => {
    return (items || []).filter((item: any) => {
      const matchesSearch = (item.name ?? "").toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = selectedCategory === "all" || String(item.categoryId) === String(selectedCategory)
      return matchesSearch && matchesCategory
    })
  }, [items, searchTerm, selectedCategory])

  // sort accessors calcolati dalle stesse logiche delle celle
  const withComputed = useMemo(() => {
    return filtered.map((item: any) => {
      const qty = Number(item.quantity ?? 0)
      const buy = Number(item.buyPrice ?? 0)
      const totalPayed = qty ? buy * qty : null
      const steam = Number(item.minSellPrice ?? 0)
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
        typeof item.totalNetProfit === "number" ? item.totalNetProfit : null

      const cat = categories?.find((c: any) => String(c.id) === String(item.categoryId))
      const lastUpdate = item.editDate ?? item.insertDate

      return {
        __calc: { qty, buy, totalPayed, steam, netProfit, percentNetProfit, totalNetProfit, categoryName: cat?.name ?? "", lastUpdate },
        ...item,
      }
    })
  }, [filtered, categories])

  const sorted = useMemo(() => {
    if (!sortDir || !sortKey) return withComputed
    const arr = [...withComputed]
    const getVal = (row: any) => {
      const c = row.__calc
      switch (sortKey) {
        case "name": return (row.name ?? "").toString().toLowerCase()
        case "category": return (c.categoryName ?? "").toString().toLowerCase()
        case "quantity": return Number(c.qty ?? 0)
        case "buy": return c.buy ?? -Infinity
        case "totalPayed": return c.totalPayed ?? -Infinity
        case "steam": return c.steam ?? -Infinity
        case "netProfit": return c.netProfit ?? -Infinity
        case "totalNetProfit": return c.totalNetProfit ?? -Infinity
        case "percentNetProfit": return c.percentNetProfit ?? -Infinity
        case "lastUpdate": return new Date(c.lastUpdate ?? 0).getTime()
      }
    }
    arr.sort((a, b) => {
      const va = getVal(a)
      const vb = getVal(b)
      if (va === vb) return 0
      if (va === undefined || va === null) return 1
      if (vb === undefined || vb === null) return -1
      return va > vb ? 1 : -1
    })
    if (sortDir === "desc") arr.reverse()
    return arr
  }, [withComputed, sortKey, sortDir])

  const paged = useMemo(() => {
    if (CHUNK_SCROLL) return sorted.slice(0, visibleCount)
    const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
    const safePage = Math.min(page, totalPages)
    const start = (safePage - 1) * pageSize
    return sorted.slice(start, start + pageSize)
  }, [sorted, page, pageSize, visibleCount])

  const totalPages = useMemo(() => Math.max(1, Math.ceil(sorted.length / pageSize)), [sorted.length, pageSize])

  const toggleSort = (key: SortKey) => {
    setPage(1)
    if (sortKey !== key) {
      setSortKey(key)
      setSortDir("asc")
      return
    }
    // ciclo: asc -> desc -> none -> asc
    setSortDir((d) => (d === "asc" ? "desc" : d === "desc" ? null : "asc"))
  }

  const handleDelete = async (id: string) => {
    setIsDeleting(id)
    try {
      await itemsApi.delete(id)
      toast({ title: "Success", description: "Item deleted" })
      onDelete()
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 409) {
          toast({ title: "Error", description: "Item in use, cannot delete", variant: "destructive" })
        } else {
          const messages = Object.values(error.errors ?? {}).flat().join(", ")
          toast({ title: "Error", description: messages || "Error during deletion", variant: "destructive" })
        }
      } else {
        toast({ title: "Error", description: "Something went wrong during deletion", variant: "destructive" })
      }
    } finally {
      setIsDeleting(null)
    }
  }

  const handleUpdatePrice = async (id: string, name: string) => {
    setIsUpdating(id)
    try {
      await steamApi.updateById(id)
      toast({ title: "Price updated", description: `"${name}" updated from Steam.` })
    } catch (error) {
      if (error instanceof ApiError) {
        const messages = Object.values(error.errors ?? {}).flat().join(", ")
        toast({ title: "Error updating price", description: messages || "Unable to update price from Steam", variant: "destructive" })
      } else {
        toast({ title: "Error updating price", description: "Something went wrong contacting the Steam API", variant: "destructive" })
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

  // UI helpers
  const SortableHead = ({
    label,
    k,
    alignRight,
    title,
  }: { label: string; k: SortKey; alignRight?: boolean; title?: string }) => (
    <TableHead className={alignRight ? "text-right" : ""} title={title}>
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
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          placeholder="Search items..."
          value={searchTerm}
          onChange={(e) => { setSearchTerm(e.target.value); setPage(1) }}
          className="flex-1"
        />
        <select
          value={selectedCategory}
          onChange={(e) => { setSelectedCategory(e.target.value); setPage(1) }}
          className="px-3 rounded-lg bg-secondary border border-border text-foreground h-10"
        >
          <option value="all">All Categories</option>
          {categories?.map((cat: any) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>

        {!CHUNK_SCROLL && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Rows:</span>
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1) }}
              className="px-3 rounded-lg bg-secondary border border-border text-foreground h-10"
            >
              {[10, 25, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        )}
      </div>

      {/* Wrapper che evita overflow orizzontale e verticale */}
      <div className="rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <div className="max-h-[70vh] overflow-y-auto">
            <Table className="min-w-[900px]">
              <TableHeader className="bg-secondary sticky top-0 z-10">
                <TableRow>
                  <SortableHead label="Name" k="name" />
                  <SortableHead label="Category" k="category" />
                  <SortableHead label="Quantity" k="quantity" alignRight />
                  <SortableHead label="Payed" k="buy" alignRight title="Buy Price" />
                  <SortableHead label="Total Payed" k="totalPayed" alignRight />
                  <SortableHead label="Steam Price" k="steam" alignRight title="Steam Price (from Steam API)" />
                  <SortableHead label="Net Profit" k="netProfit" alignRight title="Net Profit at -15% tax" />
                  <SortableHead label="Total Net Profit" k="totalNetProfit" alignRight title="Total Net Profit at -15% tax" />
                  <SortableHead label="Yield" k="percentNetProfit" alignRight title="Yield at -15% tax" />
                  <SortableHead label="Last Update" k="lastUpdate" alignRight />
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {sorted.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                      No items found.
                    </TableCell>
                  </TableRow>
                ) : (
                  paged.map((row: any) => {
                    const item = row
                    const c = row.__calc
                    const category = categories?.find((ct: any) => String(ct.id) === String(item.categoryId))
                    const isRowUpdating = isUpdating === item.id
                    const isRowDeleting = isDeleting === item.id

                    const totalPayed = c.totalPayed
                    const steam = c.steam

                    let steamDeltaPct: number | null = null
                    if ((c.buy ?? 0) > 0 && (steam ?? 0) > 0) {
                      steamDeltaPct = ((steam - c.buy) / c.buy) * 100
                    }
                    const steamTextStyle = getPriceTextColor(steamDeltaPct)
                    const profitCellStyle = getProfitStyles(c.percentNetProfit ?? null)

                    return (
                      <TableRow
                        key={item.id}
                        className="hover:bg-secondary/50 cursor-pointer"
                        onClick={() => setDetailItem(item)}
                      >
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell><Badge variant="outline">{category?.name || "N/A"}</Badge></TableCell>
                        <TableCell className="text-right">{c.qty || "--"}</TableCell>
                        <TableCell className="text-right">{c.buy ? formatCurrency(c.buy) : "--"}</TableCell>
                        <TableCell className="text-right">{totalPayed ? formatCurrency(totalPayed) : "--"}</TableCell>
                        <TableCell className="text-right">
                          {steam ? (
                            <span
                              style={steamTextStyle}
                              title={steamDeltaPct === null ? "" : `${formatSigned(steamDeltaPct, 2)}% vs paid`}
                              className="font-medium"
                            >
                              {formatCurrency(steam)}
                            </span>
                          ) : ("--")}
                        </TableCell>
                        <TableCell className="text-right">
                          {c.netProfit === null ? "--" : (
                            <span
                              className="inline-flex items-center justify-end px-2 py-0.5 rounded border text-sm font-medium"
                              style={profitCellStyle}
                              title={c.percentNetProfit === null ? "" : `${c.percentNetProfit.toFixed(2)}%`}
                            >
                              {`${c.netProfit > 0 ? "+" : c.netProfit < 0 ? "−" : ""}${formatCurrency(Math.abs(c.netProfit))}`}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {c.totalNetProfit === null ? "--" : (
                            <span
                              className="inline-flex items-center justify-end px-2 py-0.5 rounded border text-sm font-medium"
                              style={profitCellStyle}
                              title={c.percentNetProfit === null ? "" : `${c.percentNetProfit.toFixed(2)}%`}
                            >
                              {`${c.totalNetProfit > 0 ? "+" : c.totalNetProfit < 0 ? "−" : ""}${formatCurrency(Math.abs(c.totalNetProfit))}`}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {c.percentNetProfit === null ? "--" : (
                            <span
                              className="inline-flex items-center justify-end px-2 py-0.5 rounded border text-sm font-medium tabular-nums"
                              style={profitCellStyle}
                            >
                              {`${formatSigned(c.percentNetProfit, 2)}%`}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right text-xs text-muted-foreground">
                          {item.editDate ? formatDate(item.editDate) : formatDate(item.insertDate)}
                        </TableCell>
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

            {/* Sentinel per chunk scroll */}
            {CHUNK_SCROLL && <div ref={sentinelRef} className="h-6" />}
          </div>
        </div>
      </div>

      {/* Footer paginazione */}
      {!CHUNK_SCROLL && sorted.length > 0 && (
        <div className="flex items-center justify-between gap-3 text-sm">
          <div className="text-muted-foreground">
            Showing <strong>{paged.length}</strong> of <strong>{sorted.length}</strong> items
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage(1)} disabled={page === 1}>First</Button>
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>Prev</Button>
            <span className="px-2">Page {page} / {totalPages}</span>
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</Button>
            <Button variant="outline" size="sm" onClick={() => setPage(totalPages)} disabled={page === totalPages}>Last</Button>
          </div>
        </div>
      )}

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
