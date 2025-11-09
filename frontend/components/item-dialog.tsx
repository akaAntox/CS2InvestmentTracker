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

export function ItemDialog({ open, onOpenChange, item, categories, onSubmit }: ItemDialogProps) {
  const [formData, setFormData] = useState({
    name: item?.name ?? "",
    description: item?.description ?? "",
    categoryId: item?.categoryId ?? (categories?.[0]?.id ?? ""),
    buyPrice: item?.buyPrice ?? "",
  })
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  // sincronizza quando cambia l'item o la lista categorie
  useEffect(() => {
    setFormData({
      name: item?.name ?? "",
      description: item?.description ?? "",
      categoryId: item?.categoryId ?? (categories?.[0]?.id ?? ""),
      buyPrice: item?.buyPrice ?? "",
    })
    setErrors({})
  }, [item, categories])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrors({})

    // Validazioni base client-side (stile CategoryDialog)
    const clientErrors: Record<string, string[]> = {}
    if (!formData.name?.trim()) clientErrors["name"] = ["Name is required"]
    if (!formData.buyPrice) clientErrors["buyPrice"] = ["Buy price is required"]
    if (!formData.categoryId) clientErrors["categoryId"] = ["Category is required"]
    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors)
      setIsSubmitting(false)
      return
    }

    try {
      if (item) {
        await itemsApi.update(item.id, {
          name: formData.name.trim(),
          description: formData.description?.trim() || null,
          categoryId: formData.categoryId,
          buyPrice: Number.parseFloat(formData.buyPrice),
        })
        toast({ title: "Success", description: "Item updated" })
      } else {
        await itemsApi.create({
          name: formData.name.trim(),
          description: formData.description?.trim() || null,
          categoryId: formData.categoryId,
          buyPrice: Number.parseFloat(formData.buyPrice),
        })
        toast({ title: "Success", description: "Item created" })
      }

      onSubmit()
      onOpenChange(false)
      setFormData({ name: "", description: "", categoryId: categories?.[0]?.id ?? "", buyPrice: "" })
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.errors) {
          setErrors(error.errors)
        } else if (error.status === 409) {
          toast({
            title: "Error",
            description: "Item already exists",
            variant: "destructive",
          })
        } else {
          toast({
            title: "Error",
            description: error.message,
            variant: "destructive",
          })
        }
      } else {
        toast({
          title: "Error",
          description: "Unexpected error",
          variant: "destructive",
        })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const errorMessages = getErrorMessages(errors)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border">
        <DialogHeader>
          <DialogTitle>{item ? "Edit Item" : "New Item"}</DialogTitle>
          <DialogDescription>
            {item ? "Update the item details" : "Enter the details of the new item"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
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

          <div>
            <Label htmlFor="item-name">Name *</Label>
            <Input
              id="item-name"
              value={formData.name}
              onChange={(e) => setFormData((s) => ({ ...s, name: e.target.value }))}
              placeholder="Item name"
              className="mt-2"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="item-buyPrice">Buy Price *</Label>
              <Input
                id="item-buyPrice"
                type="number"
                step={0.01}
                value={formData.buyPrice}
                onChange={(e) => setFormData((s) => ({ ...s, buyPrice: e.target.value }))}
                placeholder="Item buy price"
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="item-category">Category *</Label>
              <select
                id="item-category"
                className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formData.categoryId}
                onChange={(e) => setFormData((s) => ({ ...s, categoryId: e.target.value }))}
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <Label htmlFor="item-description">Description</Label>
            <Textarea
              id="item-description"
              value={formData.description}
              onChange={(e) => setFormData((s) => ({ ...s, description: e.target.value }))}
              placeholder="Optional description"
              className="mt-2"
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
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
