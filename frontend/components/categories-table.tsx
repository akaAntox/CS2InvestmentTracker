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
  /** Keep parity with ItemsTable to disable a row while editing */
  editingId?: string | null
}

export function CategoriesTable({
  categories,
  isLoading,
  onEdit,
  onDelete,
  editingId,
}: Readonly<CategoriesTableProps>) {
  const [searchTerm, setSearchTerm] = useState("")
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const { toast } = useToast()

  const filteredCategories = (categories || []).filter((cat: any) =>
    (cat.name ?? "").toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleDelete = async (id: string) => {
    setIsDeleting(id)
    try {
      await categoriesApi.delete(id)
      toast({ title: "Success", description: "Category deleted" })
      onDelete()
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 409) {
          toast({
            title: "Error",
            description: "Category in use, unable to delete",
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
          placeholder="Search categories..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1"
        />
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader className="bg-secondary">
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Last Update</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCategories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  No categories found.
                </TableCell>
              </TableRow>
            ) : (
              filteredCategories.map((category: any) => {
                const isRowDeleting = isDeleting === category.id
                return (
                  <TableRow key={category.id} className="hover:bg-secondary/50">
                    <TableCell className="font-medium">{category.name}</TableCell>
                    <TableCell className="text-muted-foreground">{category.description || "--"}</TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">
                      {category.editDate
                        ? formatDate(category.editDate)
                        : category.insertDate
                        ? formatDate(category.insertDate)
                        : "--"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* Edit */}
                        <Button
                          onClick={() => onEdit(category)}
                          disabled={editingId === category.id || isRowDeleting}
                          variant="ghost"
                          size="sm"
                          title="Edit"
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
                              disabled={isRowDeleting}
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogTitle>Delete Category</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{category.name}"? This action cannot be undone.
                            </AlertDialogDescription>
                            <div className="flex gap-2">
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(category.id)}
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
