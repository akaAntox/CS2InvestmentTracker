"use client"

import { useMemo, useState } from "react"
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
import { categoriesApi, ApiError } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"
import { Edit, Trash2, ChevronUp, ChevronDown } from "lucide-react"
import "@/styles/glass.css"
import { cn } from "@/lib/utils"

interface CategoriesTableProps {
  categories: any[]
  isLoading: boolean
  onEdit: (category: any) => void
  onDelete: () => void
  /** Keep parity with ItemsTable to disable a row while editing */
  editingId?: string | null
}

// simple sorting types
type SortDir = "asc" | "desc" | null
type SortKey = "name" | "description"

function sortIcon(dir: SortDir) {
  if (dir === "asc") return <ChevronUp className="ml-1 h-4 w-4 inline-block" />
  if (dir === "desc") return <ChevronDown className="ml-1 h-4 w-4 inline-block" />
  return null
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

  const [sortKey, setSortKey] = useState<SortKey>("name")
  const [sortDir, setSortDir] = useState<SortDir>("asc")

  const filteredCategories = useMemo(
    () =>
      (categories || []).filter((cat: any) =>
        (cat.name ?? "").toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    [categories, searchTerm],
  )

  const sortedCategories = useMemo(() => {
    if (!sortDir || !sortKey) return filteredCategories

    const arr = [...filteredCategories]
    arr.sort((a, b) => {
      const av = ((a[sortKey] ?? "") as string).toString().toLowerCase()
      const bv = ((b[sortKey] ?? "") as string).toString().toLowerCase()
      if (av === bv) return 0
      return av > bv ? 1 : -1
    })

    if (sortDir === "desc") arr.reverse()
    return arr
  }, [filteredCategories, sortKey, sortDir])

  const toggleSort = (key: SortKey) => {
    if (sortKey !== key) {
      setSortKey(key)
      setSortDir("asc")
      return
    }
    // cycle: asc -> desc -> none -> asc
    setSortDir((d) => (d === "asc" ? "desc" : d === "desc" ? null : "asc"))
  }

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

  const SortableHead = ({ label, k }: { label: string; k: SortKey }) => (
    <TableHead>
      <button
        type="button"
        onClick={() => toggleSort(k)}
        className="inline-flex items-center select-none hover:underline"
      >
        <span>{label}</span>
        {sortKey === k ? sortIcon(sortDir) : null}
      </button>
    </TableHead>
  )

  return (
    <div className="glass flex flex-col h-full min-h-0 space-y-4">
      {/* Filters */}
      <div className="flex gap-3 rounded-lg">
        <Input
          placeholder="Search categories..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 glass-tile border-r border-border"
        />
      </div>

      {/* Table wrapper: header fisso, body scrollabile */}
      <div className="glass-table rounded-lg flex-1 min-h-0 overflow-hidden">
        <div className="h-full overflow-y-auto overflow-x-auto">
          <Table className="min-w-[900px] glass-panel">
            <TableHeader className="sticky top-0 z-20 glass-tile-head-table border-r text-right">
              <TableRow>
                <SortableHead label="Name" k="name" />
                <SortableHead label="Description" k="description" />
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {sortedCategories.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No categories found.
                  </TableCell>
                </TableRow>
              ) : (
                sortedCategories.map((category: any) => {
                  const isRowDeleting = isDeleting === category.id
                  return (
                    <TableRow key={category.id} className="glass-table-row">
                      <TableCell className="font-medium">{category.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {category.description || "--"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            onClick={() => onEdit(category)}
                            disabled={editingId === category.id || isRowDeleting}
                            variant="ghost"
                            size="sm"
                            className={cn(
                              "btn-glass-ghost",
                              isRowDeleting && "animate-pulse",
                            )}
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className={cn(
                                  "btn-glass-ghost",
                                  isRowDeleting && "animate-pulse",
                                )}
                                disabled={isRowDeleting}
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogTitle>Delete Category</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete &quot;{category.name}
                                &quot;? This action cannot be undone.
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
    </div>
  )
}