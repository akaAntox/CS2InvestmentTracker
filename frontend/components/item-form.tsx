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
import { getErrorMessages } from "@/lib/format-utils"
import { AlertCircle, Loader2 } from "lucide-react"

interface ItemFormProps {
  item?: any
  categories: any[]
  onSubmit: () => void
  onCancel: () => void
}

export function ItemForm({ item, categories, onSubmit, onCancel }: ItemFormProps) {
  const [formData, setFormData] = useState({
    name: item?.name || "",
    description: item?.description || "",
    categoryId: item?.categoryId || "",
    price: item?.price || "",
  })
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrors({})

    try {
      const payload = {
        ...formData,
        price: Number.parseFloat(formData.price as string),
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
          toast({
            title: "Errore",
            description: error.message,
            variant: "destructive",
          })
        }
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const errorMessages = getErrorMessages(errors)

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle>{item ? "Modifica Articolo" : "Nuovo Articolo"}</CardTitle>
        <CardDescription>
          {item ? "Aggiorna i dettagli dell'articolo" : "Inserisci i dettagli del nuovo articolo"}
        </CardDescription>
      </CardHeader>
      <CardContent>
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nome articolo"
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="categoryId">Categoria *</Label>
              <select
                id="categoryId"
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                className="w-full mt-2 px-3 py-2 rounded-lg bg-secondary border border-border text-foreground"
              >
                <option value="">Seleziona categoria</option>
                {categories?.map((cat: any) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="price">Prezzo (EUR) *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="0.00"
                className="mt-2"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Descrizione</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descrizione opzionale"
              className="mt-2"
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={onCancel}>
              Annulla
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-primary hover:bg-primary/90">
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {item ? "Aggiorna" : "Crea"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
