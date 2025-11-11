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
  id: string
  name: string
  description?: string | null
  quantity?: number | null
  buyPrice?: number | null            // per unit
  totalBuyPrice?: number | null
  minSellPrice?: number | null        // per unit (Steam)
  avgSellPrice?: number | null        // per unit
  sellVolume?: number | null
  totalMinSellPrice?: number | null
  netProfit?: number | null
  totalNetProfit?: number | null
  percentNetProfit?: number | null
  categoryId?: string | number | null
  category?: string | { id: string | number; name: string; description?: string | null } | null
  insertDate?: string | Date | null
  editDate?: string | Date | null
}

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  item: Item | null
  categories: { id: string | number; name: string }[]
}

export function ItemDetailDialog({ open, onOpenChange, item, categories }: Readonly<Props>) {
  // ------- IMAGE (via backend client: steamApi.getImage(id) => { url } | string) -------
  const [imgUrl, setImgUrl] = useState<string | null>(null)
  const [imgLoading, setImgLoading] = useState(false)
  const [imgError, setImgError] = useState<string | null>(null)

  useEffect(() => {
    let aborted = false
    setImgError(null)
    setImgUrl(null)

    async function load() {
      if (!open || !item?.id) return
      setImgLoading(true)
      try {
        const res: any = await steamApi.getImage(item.id) // usa il TUO endpoint corretto
        if (aborted) return
        const url = typeof res === "string" ? res : (res?.url ?? null)
        if (url) setImgUrl(url)
        else setImgError("No image")
      } catch (e: any) {
        if (!aborted) setImgError(e?.message ?? "Error loading image")
      } finally {
        if (!aborted) setImgLoading(false)
      }
    }

    load()
    return () => { aborted = true }
  }, [open, item?.id])

  // ------------------- DERIVED FIELDS -------------------
  const derived = useMemo(() => {
    if (!item) return {}
    const qty = Number(item.quantity ?? 0)
    const buy = Number(item.buyPrice ?? 0)
    const steam = Number(item.minSellPrice ?? 0)

    const totalPayed = item.totalBuyPrice ?? (qty && buy ? qty * buy : null)
    const totalSteam = item.totalMinSellPrice ?? (qty && steam ? qty * steam : null)
    const netProfit =
      item.netProfit ?? (totalSteam != null && totalPayed != null ? totalSteam - totalPayed : null)
    const percentNetProfit =
      item.percentNetProfit ?? (netProfit != null && totalPayed ? (netProfit / totalPayed) * 100 : null)

    return { qty, buy, steam, totalPayed, totalSteam, netProfit, percentNetProfit }
  }, [item])

  // ------------------- CATEGORY LABEL -------------------
  type CategoryShape = { id: string | number; name: string; description?: string | null }
  function getCategoryLabel(
    itm: any,
    cats: { id: string | number; name: string }[]
  ): string | null {
    const raw = itm?.category as unknown
    if (typeof raw === "string") return raw
    if (raw && typeof raw === "object" && "name" in (raw as any)) {
      const name = (raw as CategoryShape).name
      if (typeof name === "string" && name.length > 0) return name
    }
    const id = itm?.categoryId
    const found = cats.find(c => String(c.id) === String(id))
    return found?.name ?? null
  }
  const categoryLabel = getCategoryLabel(item, categories)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-[1200px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="truncate">{item?.name}</span>
            {categoryLabel ? <Badge variant="outline">{categoryLabel}</Badge> : null}
          </DialogTitle>
          <DialogDescription>
            Dettagli dell’item, prezzi Steam e metriche di profitto.
          </DialogDescription>
        </DialogHeader>

        {!item ? null : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* IMAGE */}
            <div className="relative flex flex-col gap-2">
              <div className="sm:max-w-[300px] aspect-square rounded-lg border bg-secondary/40 overflow-hidden">
                {imgLoading ? (
                  <Skeleton className="h-full w-full" />
                ) : imgUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={imgUrl}
                    alt={item.name}
                    className="h-full w-full object-cover"
                    loading="lazy"
                    onError={() => setImgError("Image not available")}
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-sm text-muted-foreground">
                    {imgError ?? "No image"}
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground line-clamp-4">
                {item.description || "—"}
              </p>
            </div>

            {/* DETAILS */}
            <div className="grid sm:grid-cols-2 gap-3">
              <Detail label="Quantity" value={fmt(item.quantity)} />
              <Detail label="Buy Price (unit)" value={fmtCur(item.buyPrice)} />
              <Detail label="Total Buy Price" value={fmtCur((derived as any).totalPayed)} />
              <Detail label="Steam Min (unit)" value={fmtCur(item.minSellPrice)} />
              <Detail label="Steam Avg (unit)" value={fmtCur(item.avgSellPrice)} />
              <Detail label="Sell Volume" value={fmt(item.sellVolume)} />
              <Detail label="Total Steam (min)" value={fmtCur((derived as any).totalSteam)} />
              <Detail label="Net Profit" value={signedCur((derived as any).netProfit)} />
              <Detail label="Total Net Profit" value={signedCur(item.totalNetProfit)} />
              <Detail label="% Net Profit" value={signedPct((derived as any).percentNetProfit)} />
              <Detail label="Category Id" value={fmt(item.categoryId)} />
              <Detail label="Category" value={categoryLabel || "—"} />
              <Detail label="Insert Date" value={fmtDate(item.insertDate)} />
              <Detail label="Edit Date" value={fmtDate(item.editDate)} />
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

/* ---------------- helpers ---------------- */

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border p-3">
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 font-medium">{value}</div>
    </div>
  )
}
function fmt(n: any) { if (n === null || n === undefined || Number.isNaN(Number(n))) return "—"; return String(n) }
function fmtCur(n: any) { const v = Number(n); return Number.isFinite(v) && v !== 0 ? formatCurrency(v) : "—" }
function signedCur(n: any) { const v = Number(n); if (!Number.isFinite(v) || v === 0) return v === 0 ? formatCurrency(0) : "—"; const s = v > 0 ? "+" : "−"; return `${s}${formatCurrency(Math.abs(v))}` }
function signedPct(n: any) { const v = Number(n); if (!Number.isFinite(v)) return "—"; const s = v > 0 ? "+" : v < 0 ? "−" : ""; return `${s}${Math.abs(v).toFixed(2)}%` }
function fmtDate(d: any) { return d ? formatDate(d) : "—" }
  