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
  }, [open, item?.id])

  const title = safeItem?.name ?? "Element Details"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        key={safeItem?.id ?? "noitem"}
        className="
          glass-dialog
          max-w-[96vw] md:max-w-[90vw] lg:max-w-[1100px] xl:max-w-5xl
          max-h-[95vh] overflow-y-auto
          p-0 sm:rounded-lg
        "
      >
        <DialogHeader className="px-5 pt-5 pb-3 border-b min-w-0">
          <DialogTitle className="truncate text-balance">{title}</DialogTitle>
          {(categoryLabel || safeItem?.marketName || safeItem?.quantity != null) && (
            <DialogDescription className="flex flex-wrap gap-2 mt-2">
              {categoryLabel && <Badge variant="secondary">{categoryLabel}</Badge>}
              {safeItem?.marketName && <Badge>{safeItem.marketName}</Badge>}
              {safeItem?.quantity != null && <Badge variant="outline">Qty: {safeItem.quantity}</Badge>}
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="p-5 min-h-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* IMMAGINE */}
            <section className="min-w-0">
              <div className="w-full rounded-md border-2 overflow-hidden">
                <div className="relative w-full aspect-4/3 max-h-80 sm:max-h-[360px] md:max-h-[420px]">
                  {imgLoading ? (
                    <div className="p-4">
                      <Skeleton className="w-full h-64" />
                      <div className="mt-3 flex gap-2">
                        <Skeleton className="h-4 w-1/3" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                    </div>
                  ) : imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={imageUrl}
                      alt={safeItem?.name ?? "Item image"}
                      className="absolute inset-0 w-full h-full object-contain"
                      loading="lazy"
                      decoding="async"
                      fetchPriority="low"
                      onError={() => setImgError("Image not available")}
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-6 text-sm text-muted-foreground text-center">
                      <span>{imgError ?? "No image available"}</span>
                    </div>
                  )}
                </div>
              </div>

              {(safeItem?.createdAt || safeItem?.updatedAt || safeItem?.insertDate || safeItem?.editDate) && (
                <div className="mt-3 text-xs text-muted-foreground">
                  {safeItem?.createdAt && <span>Creato: {formatDate(safeItem.createdAt as any)}</span>}
                  {safeItem?.updatedAt && <span className="ml-2">Aggiornato: {formatDate(safeItem.updatedAt as any)}</span>}
                  {safeItem?.insertDate && <span className="ml-2">Inserito: {formatDate(safeItem.insertDate as any)}</span>}
                  {safeItem?.editDate && <span className="ml-2">Modificato: {formatDate(safeItem.editDate as any)}</span>}
                </div>
              )}
            </section>

            {/* DESCRIZIONE + DETTAGLI */}
            <section className="min-w-0">
              <div className="prose prose-sm md:prose-base max-w-none wrap-break-word hyphens-auto text-foreground">
                {loading ? (
                  <div>
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-full mt-3" />
                    <Skeleton className="h-4 w-5/6 mt-2" />
                    <Skeleton className="h-4 w-2/3 mt-2" />
                  </div>
                ) : safeItem?.description ? (
                  <p className="whitespace-pre-wrap">{safeItem.description}</p>
                ) : (
                  <p className="text-muted-foreground">No notes.</p>
                )}
              </div>

              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <Stat label="Purchase price (unit)" value={fmtCur(safeItem?.buyPrice)} />
                <Stat label="Minimum sell price (unit)" value={fmtCur(safeItem?.minSellPrice)} />
                <Stat label="Average price (unit)" value={fmtCur(safeItem?.avgSellPrice)} />
                <Stat label="Sales volume" value={fmt(safeItem?.sellVolume)} />
                <Stat label="Total expenditure" value={fmtCur(safeItem?.totalBuyPrice)} />
                <Stat label="Theoretical revenue (min)" value={fmtCur(safeItem?.totalMinSellPrice)} />
                <Stat label="Net profit (unit)" value={fmtCur(safeItem?.netProfit)} />
                <Stat label="Total net profit" value={fmtCur(safeItem?.totalNetProfit)} />
                <Stat
                  label="Yield %"
                  value={
                    safeItem?.percentNetProfit == null
                      ? "—"
                      : `${Number(safeItem.percentNetProfit).toFixed(2)}%`
                  }
                />
              </div>
            </section>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function Stat({ label, value }: Readonly<{ label: string; value: string | number }>) {
  return (
    <div className="rounded-md border p-3 min-w-0">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 font-medium truncate">{value}</div>
    </div>
  )
}

/* helpers */
function fmt(n?: number | null) { return n == null ? "—" : String(n) }
function fmtCur(n?: number | null) { return n == null ? "—" : formatCurrency(Number(n)) }
