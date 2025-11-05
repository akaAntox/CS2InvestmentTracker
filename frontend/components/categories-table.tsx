"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { formatDate } from "@/lib/format-utils"
import { categoriesApi, ApiError } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"
import { Edit, Trash2 } from "lucide-react"

interface CategoriesTableProps {
  categories: any[]
  isLoading: boolean
  onEdit: (category: any) => void
  onDelete: () => void
}

export function CategoriesTable({ categories, isLoading, onEdit, onDelete }: CategoriesTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const { toast } = useToast()

  const filteredCategories = (categories || []).filter((cat: any) =>
    cat.name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleDelete = async (id: string) => {
    setIsDeleting(id)
    try {
      await categoriesApi.delete(id)
      toast({
        title: "Successo",
        description: "Categoria eliminata",
      })
      onDelete()
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 409) {
          toast({
            title: "Errore",
            description: "Categoria in uso, impossibile eliminare",
            variant: "destructive",
          })
        } else {
          const messages = Object.entries(error.errors || {})
            .flatMap(([_, msgs]: any) => msgs)
            .join(", ")
          toast({
            title: "Errore",
            description: messages || "Errore durante l'eliminazione",
            variant: "destructive",
          })
        }
      }
    } finally {
      setIsDeleting(null)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filter */}
      <Input placeholder="Cerca categorie..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />

      {/* Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader className="bg-secondary">
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Descrizione</TableHead>
              <TableHead className="text-right">Data Creazione</TableHead>
              <TableHead className="text-right">Azioni</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCategories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  Nessuna categoria trovata
                </TableCell>
              </TableRow>
            ) : (
              filteredCategories.map((category: any) => (
                <TableRow key={category.id} className="hover:bg-secondary/50">
                  <TableCell className="font-medium">{category.name}</TableCell>
                  <TableCell className="text-muted-foreground">{category.description || "--"}</TableCell>
                  <TableCell className="text-right text-xs text-muted-foreground">
                    {formatDate(category.insertDate)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => onEdit(category)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogTitle>Elimina categoria</AlertDialogTitle>
                          <AlertDialogDescription>
                            Sei sicuro di voler eliminare "{category.name}"? Questa azione non può essere annullata.
                          </AlertDialogDescription>
                          <div className="flex gap-2">
                            <AlertDialogCancel>Annulla</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(category.id)}
                              disabled={isDeleting === category.id}
                              className="bg-destructive hover:bg-destructive/90"
                            >
                              {isDeleting === category.id ? "Eliminazione..." : "Elimina"}
                            </AlertDialogAction>
                          </div>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
