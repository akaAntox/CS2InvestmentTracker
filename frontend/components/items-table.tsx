"use client"

import { useState } from "react"
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
import { itemsApi, ApiError, steamApi } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"
import { Edit, Trash2, RefreshCcw } from "lucide-react"

interface ItemsTableProps {
  items: any[]
  categories: any[]
  isLoading: boolean
  onDelete: () => void
  onEdit: (item: any) => void
  editingId?: string | null
}

export function ItemsTable({
  items,
  categories,
  isLoading,
  onDelete,
  onEdit,
  editingId
}: Readonly<ItemsTableProps>) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [isUpdating, setIsUpdating] = useState<string | null>(null)
  const { toast } = useToast()

  const filteredItems = (items || []).filter((item: any) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "all" || String(item.categoryId) === String(selectedCategory)
    return matchesSearch && matchesCategory
  })

  const handleDelete = async (id: string) => {
    setIsDeleting(id)
    try {
      await itemsApi.delete(id)
      toast({ title: "Success", description: "Item deleted" })
      onDelete()
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 409) {
          toast({
            title: "Error",
            description: "Item in use, cannot delete",
            variant: "destructive",
          })
        } else {
          const messages = Object.values(error.errors ?? {}).flat().join(", ")
          toast({
            title: "Error",
            description: messages || "Error during deletion",
            variant: "destructive",
          })
        }
      } else {
        toast({
          title: "Error",
          description: "Something went wrong during deletion",
          variant: "destructive",
        })
      }
    } finally {
      setIsDeleting(null)
    }
  }

  const handleUpdatePrice = async (id: string, name: string) => {
    setIsUpdating(id)
    try {
      await steamApi.updateById(id)
      toast({
        title: "Price updated",
        description: `"${name}" updated from Steam.`,
      })
    } catch (error) {
      if (error instanceof ApiError) {
        const messages = Object.values(error.errors ?? {}).flat().join(", ")
        toast({
          title: "Error updating price",
          description: messages || "Unable to update price from Steam",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Error updating price",
          description: "Something went wrong contacting the Steam API",
          variant: "destructive",
        })
      }
    } finally {
      setIsUpdating(null)
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
          placeholder="Search items..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1"
        />
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-3 py-2 rounded-lg bg-secondary border border-border text-foreground"
        >
          <option value="all">All Categories</option>
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
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Buy Price</TableHead>
              <TableHead className="text-right">Min Steam Price</TableHead>
              <TableHead className="text-right">Avg Steam Price</TableHead>
              <TableHead className="text-right">Last Update</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No items found.
                </TableCell>
              </TableRow>
            ) : (
              filteredItems.map((item: any) => {
                const category = categories?.find((c) => c.id === item.categoryId)
                const isRowUpdating = isUpdating === item.id
                const isRowDeleting = isDeleting === item.id
                return (
                  <TableRow key={item.id} className="hover:bg-secondary/50">
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{category?.name || "N/A"}</Badge>
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(item.buyPrice)}</TableCell>
                    <TableCell className="text-right text-accent">
                      {item.minSellPrice ? formatCurrency(item.minSellPrice) : "--"}
                    </TableCell>
                    <TableCell className="text-right text-accent">
                      {item.avgSellPrice ? formatCurrency(item.avgSellPrice) : "--"}
                    </TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">
                      {item.editDate ? formatDate(item.editDate) : formatDate(item.insertDate)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* Update price from Steam */}
                        <Button
                          onClick={() => handleUpdatePrice(item.id, item.name)}
                          variant="ghost"
                          size="sm"
                          disabled={isRowUpdating || isRowDeleting}
                          className={isRowUpdating ? "animate-pulse" : undefined}
                          title="Update price from Steam"
                        >
                          <RefreshCcw className={`w-4 h-4 ${isRowUpdating ? "animate-spin" : ""}`} />
                          <span className="sr-only">Update price</span>
                        </Button>

                        {/* Edit */}
                        <Button
                          onClick={() => onEdit(item)}
                          disabled={editingId === item.id || isRowUpdating || isRowDeleting}
                          variant="ghost"
                          size="sm"
                          title="Modifica"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>

                        {/* Delete */}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              disabled={isRowUpdating || isRowDeleting}
                              title="Elimina"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogTitle>Delete Item</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{item.name}"? This action cannot be undone.
                            </AlertDialogDescription>
                            <div className="flex gap-2">
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(item.id)}
                                disabled={isRowDeleting}
                                className="bg-destructive hover:bg-destructive/90"
                              >
                                {isRowDeleting ? "Deleting..." : "Delete"}
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
