"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { formatCurrency, formatDate } from "@/lib/format-utils"
import { steamApi } from "@/lib/api-client"
import { cn } from "@/lib/utils"

type Item = {
  id: string | number
  name: string
  description?: string | null
  quantity?: number | null
  buyPrice?: number | null
  totalBuyPrice?: number | null
  minSellPrice?: number | null
  avgSellPrice?: number | null
  sellVolume?: number | null
  totalMinSellPrice?: number | null
  netProfit?: number | null
  totalNetProfit?: number | null
  percentNetProfit?: number | null
  categoryId?: string | number | null
  category?: string | { id: string | number; name: string; description?: string | null } | null
  marketName?: string | null
  createdAt?: string | Date | null
  updatedAt?: string | Date | null
  insertDate?: string | Date | null
  editDate?: string | Date | null
}

type Props = {
  open: boolean
  onOpenChange: (v: boolean) => void
  item?: Item | null
  loading?: boolean
  categories?: { id: string | number; name: string }[]
}

export function ItemDetailDialog({ open, onOpenChange, item, loading, categories = [] }: Readonly<Props>) {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [imgLoading, setImgLoading] = useState(false)
  const [imgError, setImgError] = useState<string | null>(null)

  const safeItem = useMemo(() => (item ? { ...item, name: item.name ?? "Senza nome" } : null), [item])

  const categoryLabel = useMemo(() => {
    const it = safeItem
    if (!it) return null
    const raw = it.category as any
    if (typeof raw === "string" && raw) return raw
    if (raw && typeof raw === "object" && typeof raw.name === "string" && raw.name) return raw.name
    if (it.categoryId != null) {
      const found = categories.find(c => String(c.id) === String(it.categoryId))
      if (found) return found.name
    }
    return null
  }, [safeItem, categories])

  useEffect(() => { 
    let aborted = false 
    setImgError(null) 
    setImageUrl(null) 

    async function load() { 
      if (!open || !safeItem?.id) return setImgLoading(true) 
      try { 
        setImgLoading(true)
        const res: any = await steamApi.getImage(safeItem?.id as any) 
        if (aborted) return 
        const url = typeof res === "string" ? res : (res?.url ?? null)
        if (url) 
          setImageUrl(url) 
        else 
          setImgError("No image") 
      } catch (e: any) { 
        if (!aborted) setImgError(e?.message ?? "Error loading image") 
      } finally { 
        if (!aborted) setImgLoading(false) 
      } 
    } 
    load() 
    return () => { aborted = true } 
  }, [open, safeItem?.id])

  const title = safeItem?.name ?? "Element Details"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        key={safeItem?.id ?? "noitem"}
        className={cn(
          "glass-dialog p-0 gap-0",
          "w-full max-w-[95vw] sm:max-w-2xl md:max-w-4xl lg:max-w-5xl",
          "max-h-[90vh] flex flex-col overflow-hidden", // Fix height constraints
          "sm:rounded-xl"
        )}
      >
        <DialogHeader className="px-4 py-4 sm:px-6 sm:py-5 border-b min-h-0 flex-shrink-0">
          <DialogTitle className="text-xl sm:text-2xl truncate pr-6">{title}</DialogTitle>
          {(categoryLabel || safeItem?.marketName || safeItem?.quantity != null) && (
            <DialogDescription className="flex flex-wrap gap-2 mt-2">
              {categoryLabel && <Badge variant="secondary" className="bg-secondary/50">{categoryLabel}</Badge>}
              {safeItem?.marketName && <Badge variant="outline" className="border-border/50">{safeItem.marketName}</Badge>}
              {safeItem?.quantity != null && <Badge variant="default">Qty: {safeItem.quantity}</Badge>}
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            
            {/* COLONNA SINISTRA: Immagine e Date */}
            <section className="flex flex-col gap-4">
              <div className="w-full rounded-lg border bg-card/50 overflow-hidden shadow-sm">
                <div className="relative w-full aspect-[4/3] md:aspect-square lg:aspect-[4/3]">
                  {imgLoading ? (
                    <div className="p-4 w-full h-full flex flex-col">
                      <Skeleton className="w-full flex-1 rounded-md" />
                      <div className="mt-4 flex gap-2">
                        <Skeleton className="h-4 w-1/3" />
                        <Skeleton className="h-4 w-1/4" />
                      </div>
                    </div>
                  ) : imageUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={imageUrl}
                      alt={safeItem?.name ?? "Item image"}
                      className="absolute inset-0 w-full h-full object-contain p-2"
                      loading="lazy"
                      onError={() => setImgError("Image not available")}
                    />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-6 text-sm text-muted-foreground text-center">
                      <span className="text-4xl">🖼️</span>
                      <span>{imgError ?? "No image available"}</span>
                    </div>
                  )}
                </div>
              </div>

              {(safeItem?.createdAt || safeItem?.updatedAt || safeItem?.insertDate || safeItem?.editDate) && (
                <div className="rounded-lg bg-secondary/20 p-3 text-xs text-muted-foreground space-y-1">
                  {safeItem?.createdAt && <div className="flex justify-between"><span>Created:</span> <span className="font-mono">{formatDate(safeItem.createdAt as any)}</span></div>}
                  {safeItem?.insertDate && <div className="flex justify-between"><span>Inserted:</span> <span className="font-mono">{formatDate(safeItem.insertDate as any)}</span></div>}
                  {safeItem?.updatedAt && <div className="flex justify-between"><span>Updated:</span> <span className="font-mono">{formatDate(safeItem.updatedAt as any)}</span></div>}
                  {safeItem?.editDate && <div className="flex justify-between"><span>Modified:</span> <span className="font-mono">{formatDate(safeItem.editDate as any)}</span></div>}
                </div>
              )}
            </section>

            {/* COLONNA DESTRA: Descrizione e Statistiche */}
            <section className="flex flex-col gap-6 min-w-0">
              
              {/* Descrizione */}
              <div className="space-y-2">
                <h3 className="font-semibold text-foreground/90 flex items-center gap-2">
                  Description
                </h3>
                <div className="rounded-lg border bg-card/30 p-3 text-sm text-foreground/80 break-words whitespace-pre-wrap max-h-40 overflow-y-auto">
                  {loading ? (
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-5/6" />
                      <Skeleton className="h-4 w-2/3" />
                    </div>
                  ) : safeItem?.description ? (
                    safeItem.description
                  ) : (
                    <span className="text-muted-foreground italic">No description available.</span>
                  )}
                </div>
              </div>

              {/* Griglia Statistiche */}
              <div className="space-y-2">
                <h3 className="font-semibold text-foreground/90">Market Data</h3>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                  <Stat label="Buy (Unit)" value={fmtCur(safeItem?.buyPrice)} />
                  <Stat label="Sell (Unit)" value={fmtCur(safeItem?.minSellPrice)} />
                  <Stat label="Avg Price" value={fmtCur(safeItem?.avgSellPrice)} />
                  
                  <Stat label="Volume" value={fmt(safeItem?.sellVolume)} />
                  <Stat label="Total Cost" value={fmtCur(safeItem?.totalBuyPrice)} />
                  <Stat label="Est. Revenue" value={fmtCur(safeItem?.totalMinSellPrice)} />
                  
                  <Stat 
                    label="Net Profit" 
                    value={fmtCur(safeItem?.netProfit)} 
                    highlight={Number(safeItem?.netProfit ?? 0) > 0 ? "positive" : Number(safeItem?.netProfit ?? 0) < 0 ? "negative" : "neutral"}
                  />
                  <Stat 
                    label="Tot. Profit" 
                    value={fmtCur(safeItem?.totalNetProfit)}
                    highlight={Number(safeItem?.totalNetProfit ?? 0) > 0 ? "positive" : Number(safeItem?.totalNetProfit ?? 0) < 0 ? "negative" : "neutral"}
                  />
                  <Stat
                    label="Yield %"
                    value={safeItem?.percentNetProfit == null ? "—" : `${Number(safeItem.percentNetProfit).toFixed(2)}%`}
                    highlight={Number(safeItem?.percentNetProfit ?? 0) > 0 ? "positive" : Number(safeItem?.percentNetProfit ?? 0) < 0 ? "negative" : "neutral"}
                  />
                </div>
              </div>
            </section>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function Stat({ label, value, highlight = "neutral" }: Readonly<{ label: string; value: string | number, highlight?: "positive" | "negative" | "neutral" }>) {
  const colorClass = 
    highlight === "positive" ? "text-green-500" : 
    highlight === "negative" ? "text-red-400" : 
    "text-foreground";

  return (
    <div className="rounded-md border bg-card/40 p-3 min-w-0 flex flex-col justify-between">
      <div className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider">{label}</div>
      <div className={cn("mt-1 font-medium truncate text-sm sm:text-base", colorClass)} title={String(value)}>
        {value}
      </div>
    </div>
  )
}

/* helpers */
function fmt(n?: number | null) { return n == null ? "—" : String(n) }
function fmtCur(n?: number | null) { return n == null ? "—" : formatCurrency(Number(n)) }