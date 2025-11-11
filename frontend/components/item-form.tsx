"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { itemsApi, ApiError } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"
import { AlertCircle, Loader2 } from "lucide-react"

interface ItemFormProps {
  item?: any
  categories: any[]
  onSubmit: () => void
  onCancel: () => void
}

// --- helper: normalizza numeri (virgola italiana -> punto) ---
function normalizeNumber(input: string): string {
  if (typeof input !== "string") return input as unknown as string
  return input.replace(/\s+/g, "").replace(",", ".")
}

// --- helper: valida e ritorna record campo -> errori ---
function validate(form: {
  name: string
  description: string
  categoryId: string
  buyPrice: string
}) {
  const errors: Record<string, string[]> = {}

  const name = form.name.trim()
  const description = form.description?.trim() ?? ""
  const categoryId = form.categoryId
  const raw = normalizeNumber(form.buyPrice)
  const price = raw === "" ? NaN : Number.parseFloat(raw)

  // name
  if (!name) {
    errors.name = ["Name is required."]
  } else {
    if (name.length < 2) (errors.name ??= []).push("Minimum 2 characters.")
    if (name.length > 120) (errors.name ??= []).push("Maximum 120 characters.")
  }

  // category
  if (!categoryId) {
    errors.categoryId = ["Category is required."]
  }

  // price
  if (Number.isNaN(price)) {
    errors.buyPrice = ["Invalid price."]
  } else {
    if (price <= 0) (errors.buyPrice ??= []).push("Price must be greater than 0.")
    if (price > 1_000_000) (errors.buyPrice ??= []).push("Price too high.")
    // max 2 decimali
    const decimals = raw.split(".")[1]
    if (decimals && decimals.length > 2) (errors.buyPrice ??= []).push("Maximum 2 decimals.")
  }

  // description (opzionale)
  if (description && description.length > 1000) {
    errors.description = ["Maximum 1000 characters."]
  }

  return { errors, parsedPrice: Number.isNaN(price) ? undefined : price }
}

// --- helper: unisce errori per riepilogo ---
function flattenErrors(errs: Record<string, string[]>): string[] {
  return Object.values(errs).flat()
}

export function ItemForm({ item, categories, onSubmit, onCancel }: ItemFormProps) {
  const [formData, setFormData] = useState({
    name: item?.name || "",
    description: item?.description || "",
    categoryId: item?.categoryId || "",
    buyPrice: item?.buyPrice?.toString?.() ?? "",
  })
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const setField =
    <K extends keyof typeof formData>(key: K) =>
    (value: string) => {
      const next = { ...formData, [key]: value }
      setFormData(next)
      // validazione live solo per i campi toccati (UX più morbida)
      if (touched[key as string]) {
        const { errors: nextErrors } = validate(next)
        setErrors(nextErrors)
      }
    }

  const onBlur =
    (field: keyof typeof formData) =>
    () => {
      setTouched((t) => ({ ...t, [field]: true }))
      const { errors: nextErrors } = validate(formData)
      setErrors(nextErrors)
    }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // validazione finale
    const { errors: finalErrors, parsedPrice } = validate(formData)
    setErrors(finalErrors)
    setTouched({ name: true, categoryId: true, buyPrice: true, description: true })

    if (Object.keys(finalErrors).length > 0) {
      // focus sul primo errore
      const firstField = Object.keys(finalErrors)[0]
      const el = document.getElementById(firstField)
      el?.focus()
      return
    }

    setIsSubmitting(true)
    try {
      const payload = {
        name: formData.name.trim(),
        description: formData.description?.trim() ?? "",
        categoryId: formData.categoryId,
        buyPrice: parsedPrice!, // è valido qui
      }

      if (item) {
        await itemsApi.update(item.id, payload)
        toast({ title: "Successo", description: "Articolo aggiornato" })
      } else {
        await itemsApi.create(payload)
        toast({ title: "Successo", description: "Articolo creato" })
      }
      onSubmit()
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.errors) {
          setErrors(error.errors)
        } else {
          toast({ title: "Errore", description: error.message, variant: "destructive" })
        }
      } else {
        toast({
          title: "Errore imprevisto",
          description: "Qualcosa è andato storto durante il salvataggio.",
          variant: "destructive",
        })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const errorMessages = flattenErrors(errors)

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle>{item ? "Edit Item" : "New Item"}</CardTitle>
        <CardDescription>
          {item ? "Update the item details" : "Enter the details of the new item"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {errorMessages.length > 0 && (
            <Alert variant="destructive" role="alert" aria-live="assertive">
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setField("name")(e.target.value)}
                onBlur={onBlur("name")}
                placeholder="Nome articolo"
                className="mt-2"
                aria-invalid={!!errors.name || undefined}
                aria-describedby={errors.name ? "name-error" : undefined}
              />
              {errors.name && (
                <p id="name-error" className="mt-1 text-sm text-red-500">
                  {errors.name.join(" ")}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="categoryId">Category *</Label>
              <select
                id="categoryId"
                value={formData.categoryId}
                onChange={(e) => setField("categoryId")(e.target.value)}
                onBlur={onBlur("categoryId")}
                className="w-full mt-2 px-3 py-2 rounded-lg bg-secondary border border-border text-foreground"
                aria-invalid={!!errors.categoryId || undefined}
                aria-describedby={errors.categoryId ? "categoryId-error" : undefined}
              >
                <option value="">Select a category</option>
                {categories?.map((cat: any) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              {errors.categoryId && (
                <p id="categoryId-error" className="mt-1 text-sm text-red-500">
                  {errors.categoryId.join(" ")}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="buyPrice">Price (EUR) *</Label>
              <Input
                id="buyPrice"
                inputMode="decimal"
                type="text" // lasciamo text per gestire virgole; normalizzo io
                value={formData.buyPrice}
                onChange={(e) => setField("buyPrice")(e.target.value)}
                onBlur={onBlur("buyPrice")}
                placeholder="0,00"
                className="mt-2"
                aria-invalid={!!errors.buyPrice || undefined}
                aria-describedby={errors.buyPrice ? "buyPrice-error" : undefined}
              />
              {errors.buyPrice && (
                <p id="buyPrice-error" className="mt-1 text-sm text-red-500">
                  {errors.buyPrice.join(" ")}
                </p>
              )}
              <p className="mt-1 text-xs text-muted-foreground">
                Puoi usare la virgola (es. 12,50)
              </p>
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setField("description")(e.target.value)}
              onBlur={onBlur("description")}
              placeholder="Optional description"
              className="mt-2"
              aria-invalid={!!errors.description || undefined}
              aria-describedby={errors.description ? "description-error" : undefined}
            />
            {errors.description && (
              <p id="description-error" className="mt-1 text-sm text-red-500">
                {errors.description.join(" ")}
              </p>
            )}
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={onCancel}>
              Annulla
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || Object.keys(errors).length > 0}
              className="bg-primary hover:bg-primary/90"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {item ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
