"use client"

import type React from "react"
import { useEffect, useState } from "react"
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
  category?: any | null
  onSubmit: () => void
}

export function CategoryDialog({ open, onOpenChange, category, onSubmit }: Readonly<CategoryDialogProps>) {
  const [formData, setFormData] = useState({
    name: category?.name ?? "",
    description: category?.description ?? "",
  })
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  // keep local state in sync with prop, like ItemDialog
  useEffect(() => {
    setFormData({
      name: category?.name ?? "",
      description: category?.description ?? "",
    })
    setErrors({})
  }, [category])

  const validate = () => {
    const clientErrors: Record<string, string[]> = {}

    if (!formData.name?.trim()) {
      clientErrors["name"] = ["Name is required"]
    }

    // (Optional) light length checks to mirror stricter UX
    if (formData.name && formData.name.trim().length > 100) {
      clientErrors["name"] = [...(clientErrors["name"] ?? []), "Name must be at most 100 characters"]
    }
    if (formData.description && formData.description.trim().length > 1000) {
      clientErrors["description"] = ["Description must be at most 1000 characters"]
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

    const payload = {
      name: formData.name.trim(),
      description: formData.description?.trim() || null,
    }

    try {
      if (category) {
        await categoriesApi.update({ id: category.id, ...payload })
        toast({ title: "Success", description: "Category updated" })
      } else {
        await categoriesApi.create(payload)
        toast({ title: "Success", description: "Category created" })
      }

      onSubmit()
      onOpenChange(false)
      setFormData({ name: "", description: "" })
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.errors) {
          setErrors(error.errors)
        } else if (error.status === 409) {
          toast({ title: "Error", description: "Category already exists", variant: "destructive" })
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
      {/* MODIFICA 1: max-h-[90vh] e overflow-y-auto 
         Fondamentale per mobile quando la tastiera è aperta o in landscape
      */}
      <DialogContent className="glass-dialog w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{category ? "Edit Category" : "New Category"}</DialogTitle>
          <DialogDescription>
            {category ? "Update the category details" : "Enter the details of the new category"}
          </DialogDescription>
        </DialogHeader>

        {/* MODIFICA 2: space-y-4 su mobile per risparmiare spazio, 
           space-y-6 su desktop per arieggiare
        */}
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          {/* Global alert for server-side errors */}
          {errorMessages.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="glass glass-panel">
                <ul className="list-disc pl-5">
                  {errorMessages.map((msg, i) => (
                    <li key={i}>{msg}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Basic details */}
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-1">
              <div>
                <Label htmlFor="cat-name">Name *</Label>
                <Input
                  id="cat-name"
                  value={formData.name}
                  onChange={(e) => setFormData((s) => ({ ...s, name: e.target.value }))}
                  placeholder="Category name"
                  className="mt-2 glass-tile"
                  aria-invalid={!!errors.name}
                  aria-describedby={errors.name ? "cat-name-error" : undefined}
                />
                {errors.name && (
                  <p id="cat-name-error" className="mt-1 text-xs text-destructive">
                    {errors.name[0]}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="cat-description">Description</Label>
            <Textarea
              id="cat-description"
              value={formData.description}
              onChange={(e) => setFormData((s) => ({ ...s, description: e.target.value }))}
              placeholder="Optional description"
              className="mt-2 glass-tile"
              rows={4}
              aria-invalid={!!errors.description}
              aria-describedby={errors.description ? "cat-description-error" : undefined}
            />
            {errors.description && (
              <p id="cat-description-error" className="mt-1 text-xs text-destructive">
                {errors.description[0]}
              </p>
            )}
          </div>

          {/* Actions */}
          {/* MODIFICA 3: padding bottom su mobile per staccare dal bordo inferiore */}
          <div className="flex justify-end gap-2 pt-2 pb-2 sm:pb-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-primary hover:bg-primary/90">
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {category ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}