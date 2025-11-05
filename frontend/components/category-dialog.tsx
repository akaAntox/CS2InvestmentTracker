"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { categoriesApi, ApiError } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"
import { getErrorMessages } from "@/lib/format-utils"
import { AlertCircle, Loader2 } from "lucide-react"

interface CategoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  category?: any
  onSubmit: () => void
}

export function CategoryDialog({ open, onOpenChange, category, onSubmit }: CategoryDialogProps) {
  const [formData, setFormData] = useState({
    name: category?.name || "",
    description: category?.description || "",
  })
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrors({})

    try {
      if (category) {
        await categoriesApi.update(category.id, formData)
        toast({ title: "Successo", description: "Categoria aggiornata" })
      } else {
        await categoriesApi.create(formData)
        toast({ title: "Successo", description: "Categoria creata" })
      }
      onSubmit()
      onOpenChange(false)
      setFormData({ name: "", description: "" })
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.errors) {
          setErrors(error.errors)
        } else if (error.status === 409) {
          toast({
            title: "Errore",
            description: "Categoria già esistente",
            variant: "destructive",
          })
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border">
        <DialogHeader>
          <DialogTitle>{category ? "Modifica Categoria" : "Nuova Categoria"}</DialogTitle>
          <DialogDescription>
            {category ? "Aggiorna i dettagli della categoria" : "Inserisci i dettagli della nuova categoria"}
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
            <Label htmlFor="cat-name">Nome *</Label>
            <Input
              id="cat-name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Nome categoria"
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="cat-description">Descrizione</Label>
            <Textarea
              id="cat-description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descrizione opzionale"
              className="mt-2"
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annulla
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-primary hover:bg-primary/90">
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {category ? "Aggiorna" : "Crea"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
