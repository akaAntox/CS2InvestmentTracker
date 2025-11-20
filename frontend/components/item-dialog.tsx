"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { itemsApi, ApiError } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"
import { getErrorMessages } from "@/lib/format-utils"
import { AlertCircle, Loader2 } from "lucide-react"

interface ItemDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item?: any | null
  categories: Array<{ id: string; name: string }>
  onSubmit: () => void
}

export function ItemDialog({ open, onOpenChange, item, categories, onSubmit }: Readonly<ItemDialogProps>) {
  const [formData, setFormData] = useState({
    name: item?.name ?? "",
    description: item?.description ?? "",
    categoryId: item?.categoryId ?? (categories?.[0]?.id ?? ""),
    quantity: item?.quantity == null ? "" : String(item.quantity),
    buyPrice: item?.buyPrice == null ? "" : String(item.buyPrice),
  })
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    setFormData({
      name: item?.name ?? "",
      description: item?.description ?? "",
      categoryId: item?.categoryId ?? (categories?.[0]?.id ?? ""),
      quantity: item?.quantity == null ? "" : String(item.quantity),
      buyPrice: item?.buyPrice == null ? "" : String(item.buyPrice),
    })
    setErrors({})
  }, [item, categories])

  const validate = () => {
    const clientErrors: Record<string, string[]> = {}

    if (!formData.name?.trim()) clientErrors["name"] = ["Name is required"]
    if (!formData.categoryId) clientErrors["categoryId"] = ["Category is required"]
    if (formData.quantity !== "") {
      const q = Number(formData.quantity)
      if (!Number.isInteger(q) || q <= 0) clientErrors["quantity"] = ["Quantity must be an integer > 0"]
    }

    // Buy Price
    if (formData.buyPrice === "" || formData.buyPrice == null) {
      clientErrors["buyPrice"] = ["Buy price is required"]
    } else {
      const normalized = String(formData.buyPrice).replace(",", ".")
      const price = Number.parseFloat(normalized)
      if (Number.isNaN(price) || price <= 0) {
        clientErrors["buyPrice"] = ["Buy price must be a positive number"]
      }
    }

    return clientErrors
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrors({})

    const clientErrors = validate()
    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors)
      setIsSubmitting(false)
      return
    }

    // parsing sicuro
    const price = Number.parseFloat(String(formData.buyPrice).replace(",", "."))
    const quantity = formData.quantity === "" ? 1 : Number.parseInt(String(formData.quantity), 10)

    try {
      const payload = {
        name: formData.name.trim(),
        description: formData.description?.trim() || null,
        categoryId: formData.categoryId,
        quantity,
        buyPrice: price,
      }

      if (item) {
        await itemsApi.update({ id: item.id, ...payload })
        toast({ title: "Success", description: "Item updated" })
      } else {
        await itemsApi.create(payload)
        toast({ title: "Success", description: "Item created" })
      }

      onSubmit()
      onOpenChange(false)
      setFormData({
        name: "",
        description: "",
        categoryId: categories?.[0]?.id ?? "",
        quantity: "",
        buyPrice: "",
      })
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.errors) {
          setErrors(error.errors)
        } else if (error.status === 409) {
          toast({ title: "Error", description: "Item already exists", variant: "destructive" })
        } else {
          toast({ title: "Error", description: error.message, variant: "destructive" })
        }
      } else {
        toast({ title: "Error", description: "Unexpected error", variant: "destructive" })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const errorMessages = getErrorMessages(errors)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass bg-card border-border">
        <DialogHeader>
          <DialogTitle>{item ? "Edit Item" : "New Item"}</DialogTitle>
          <DialogDescription>
            {item ? "Update the item details" : "Enter the details of the new item"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Alert globale (errori server) */}
          {errorMessages.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <ul className="list-disc pl-5">
                  {errorMessages.map((msg, i) => (
                    <li key={i}>{msg}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Sezione: Dettagli base */}
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="item-name">Name *</Label>
                <Input
                  id="item-name"
                  value={formData.name}
                  onChange={(e) => setFormData((s) => ({ ...s, name: e.target.value }))}
                  placeholder="Item name"
                  className="mt-2"
                  aria-invalid={!!errors.name}
                  aria-describedby={errors.name ? "item-name-error" : undefined}
                />
                {errors.name && (
                  <p id="item-name-error" className="mt-1 text-xs text-destructive">
                    {errors.name[0]}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="item-category">Category *</Label>
                <select
                  id="item-category"
                  className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.categoryId}
                  onChange={(e) => setFormData((s) => ({ ...s, categoryId: e.target.value }))}
                  aria-invalid={!!errors.categoryId}
                  aria-describedby={errors.categoryId ? "item-category-error" : undefined}
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                {errors.categoryId && (
                  <p id="item-category-error" className="mt-1 text-xs text-destructive">
                    {errors.categoryId[0]}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Sezione: Dati acquisto */}
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="item-quantity">Quantity *</Label>
                <Input
                  id="item-quantity"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  step={1}
                  value={formData.quantity}
                  onChange={(e) => setFormData((s) => ({ ...s, quantity: e.target.value }))}
                  placeholder="0"
                  className="mt-2"
                  aria-invalid={!!errors.quantity}
                  aria-describedby={errors.quantity ? "item-quantity-error" : undefined}
                />
                {errors.quantity && (
                  <p id="item-quantity-error" className="mt-1 text-xs text-destructive">
                    {errors.quantity[0]}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="item-buyPrice">Buy Price *</Label>
                <div className="mt-2 flex items-center gap-2">
                  <span className="inline-flex shrink-0 rounded-md border border-input px-2 py-2 text-sm">€</span>
                  <Input
                    id="item-buyPrice"
                    type="text"
                    inputMode="decimal"
                    value={formData.buyPrice}
                    onChange={(e) => setFormData((s) => ({ ...s, buyPrice: e.target.value }))}
                    placeholder="0.00"
                    aria-invalid={!!errors.buyPrice}
                    aria-describedby={errors.buyPrice ? "item-buyPrice-error" : undefined}
                  />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Use point or comma.
                </p>
                {errors.buyPrice && (
                  <p id="item-buyPrice-error" className="mt-1 text-xs text-destructive">
                    {errors.buyPrice[0]}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Sezione: Descrizione */}
          <div className="space-y-2">
            <Label htmlFor="item-description">Notes</Label>
            <Textarea
              id="item-description"
              value={formData.description}
              onChange={(e) => setFormData((s) => ({ ...s, description: e.target.value }))}
              placeholder="Optional notes about the item"
              className="mt-2"
              rows={4}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-primary hover:bg-primary/90">
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {item ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
