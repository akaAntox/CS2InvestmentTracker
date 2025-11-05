"use client"

import { useState } from "react"
import Link from "next/link"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { formatCurrency, formatDate } from "@/lib/format-utils"
import { itemsApi, ApiError } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"
import { Edit, Trash2 } from "lucide-react"

interface ItemsTableProps {
  items: any[]
  categories: any[]
  isLoading: boolean
  onDelete: () => void
}

export function ItemsTable({ items, categories, isLoading, onDelete }: ItemsTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const { toast } = useToast()

  const filteredItems = (items || []).filter((item: any) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "all" || item.categoryId === selectedCategory
    return matchesSearch && matchesCategory
  })

  const handleDelete = async (id: string) => {
    setIsDeleting(id)
    try {
      await itemsApi.delete(id)
      toast({
        title: "Successo",
        description: "Articolo eliminato",
      })
      onDelete()
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 409) {
          toast({
            title: "Errore",
            description: "Articolo già utilizzato, impossibile eliminare",
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
      {/* Filters */}
      <div className="flex gap-3">
        <Input
          placeholder="Cerca articoli..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1"
        />
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-3 py-2 rounded-lg bg-secondary border border-border text-foreground"
        >
          <option value="all">Tutte le categorie</option>
          {categories?.map((cat: any) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader className="bg-secondary">
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead className="text-right">Prezzo</TableHead>
              <TableHead className="text-right">Prezzo Market</TableHead>
              <TableHead className="text-right">Data</TableHead>
              <TableHead className="text-right">Azioni</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Nessun articolo trovato
                </TableCell>
              </TableRow>
            ) : (
              filteredItems.map((item: any) => {
                const category = categories?.find((c) => c.id === item.categoryId)
                return (
                  <TableRow key={item.id} className="hover:bg-secondary/50">
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{category?.name || "N/A"}</Badge>
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(item.price)}</TableCell>
                    <TableCell className="text-right text-accent">
                      {item.currentMarketPrice ? formatCurrency(item.currentMarketPrice) : "--"}
                    </TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">
                      {formatDate(item.insertDate)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/items/${item.id}`}>
                          <Button variant="ghost" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                        </Link>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogTitle>Elimina articolo</AlertDialogTitle>
                            <AlertDialogDescription>
                              Sei sicuro di voler eliminare "{item.name}"? Questa azione non può essere annullata.
                            </AlertDialogDescription>
                            <div className="flex gap-2">
                              <AlertDialogCancel>Annulla</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(item.id)}
                                disabled={isDeleting === item.id}
                                className="bg-destructive hover:bg-destructive/90"
                              >
                                {isDeleting === item.id ? "Eliminazione..." : "Elimina"}
                              </AlertDialogAction>
                            </div>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
