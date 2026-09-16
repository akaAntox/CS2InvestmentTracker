"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { itemsApi, ApiError } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"
import { formatCurrency } from "@/lib/format-utils"
import { Loader2 } from "lucide-react"

interface SellItemDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item?: any | null
  onSold: () => void
}

// yyyy-MM-dd in local time
const today = () => new Date().toLocaleDateString("sv-SE")

export function SellItemDialog({ open, onOpenChange, item, onSold }: Readonly<SellItemDialogProps>) {
  const [quantity, setQuantity] = useState("")
  const [sellPrice, setSellPrice] = useState("")
  const [sellDate, setSellDate] = useState(today())
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (!open || !item) return
    setQuantity(String(item.quantity ?? 1))
    // Suggest what Steam pays out at the current lowest price (it keeps ~15% of it)
    setSellPrice(item.minSellPrice ? (item.minSellPrice / 1.15).toFixed(2) : "")
    setSellDate(today())
    setError(null)
  }, [open, item])

  const qty = Number.parseInt(quantity, 10)
  const price = Number.parseFloat(sellPrice.replace(",", "."))
  const profit = Number.isNaN(qty) || Number.isNaN(price) ? null : (price - Number(item?.buyPrice ?? 0)) * qty

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!item) return
    if (!Number.isInteger(qty) || qty < 1 || qty > item.quantity) return setError(`Quantity must be between 1 and ${item.quantity}`)
    if (Number.isNaN(price) || price < 0) return setError("Sell price must be a positive number")
    if (!sellDate) return setError("Sell date is required")

    setIsSubmitting(true)
    try {
      await itemsApi.sell(String(item.id), { quantity: qty, sellPrice: price, sellDate })
      toast({ title: "Item sold", description: `${qty} × "${item.name}" marked as sold.` })
      onSold()
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unexpected error")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-dialog w-full max-w-md">
        <DialogHeader>
          <DialogTitle>Sell Item</DialogTitle>
          <DialogDescription>{item?.name}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="sell-quantity">Quantity (max {item?.quantity})</Label>
              <Input
                id="sell-quantity"
                type="number"
                min={1}
                max={item?.quantity}
                step={1}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="mt-2 glass-tile"
              />
            </div>
            <div>
              <Label htmlFor="sell-date">Date</Label>
              <Input
                id="sell-date"
                type="date"
                value={sellDate}
                onChange={(e) => setSellDate(e.target.value)}
                className="mt-2 glass-tile"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="sell-price">Received per unit (€, after fees)</Label>
            <Input
              id="sell-price"
              type="text"
              inputMode="decimal"
              value={sellPrice}
              onChange={(e) => setSellPrice(e.target.value)}
              placeholder="0.00"
              className="mt-2 glass-tile"
            />
          </div>

          {profit !== null && (
            <p className={profit >= 0 ? "text-sm text-emerald-500" : "text-sm text-destructive"}>
              Realized profit: {formatCurrency(profit)}
            </p>
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-primary hover:bg-primary/90">
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Sell
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
