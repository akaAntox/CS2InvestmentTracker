"use client"

import { useState, useMemo } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Calendar, Search, Plus, Pencil, Trash2, AlertCircle, ChevronDown, ChevronUp, ChevronsUpDown, RefreshCcw } from "lucide-react"
import { useApi } from "@/hooks/use-api"
import { eventsApi } from "@/lib/api-client"
import { formatDate } from "@/lib/format-utils"
import { ActionType, type EventLog } from "@/lib/types"
import { Button } from "@/components/ui/button"
import "@/styles/glass.css"

type SortField = "date" | "action" | "message"
type SortDirection = "asc" | "desc"

const ACTION_CONFIG: Record<ActionType, { label: string; icon: React.ReactNode; className: string }> = {
  [ActionType.Insert]: {
    label: "Insert",
    icon: <Plus className="w-3 h-3" />,
    className: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  },
  [ActionType.Update]: {
    label: "Update",
    icon: <Pencil className="w-3 h-3" />,
    className: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  },
  [ActionType.Delete]: {
    label: "Delete",
    icon: <Trash2 className="w-3 h-3" />,
    className: "bg-red-500/20 text-red-400 border-red-500/30",
  },
}

function ActionBadge({ action }: { action: ActionType }) {
  const config = ACTION_CONFIG[action] ?? {
    label: `Unknown (${action})`,
    icon: <AlertCircle className="w-3 h-3" />,
    className: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${config.className}`}
    >
      {config.icon}
      {config.label}
    </span>
  )
}

function SortButton({
  field,
  currentSort,
  currentDirection,
  onSort,
  children,
}: {
  field: SortField
  currentSort: SortField
  currentDirection: SortDirection
  onSort: (field: SortField) => void
  children: React.ReactNode
}) {
  const isActive = field === currentSort
  return (
    <button
      onClick={() => onSort(field)}
      className="flex items-center gap-1 hover:text-foreground transition-colors"
    >
      {children}
      {isActive ? (
        currentDirection === "asc" ? (
          <ChevronUp className="w-3.5 h-3.5" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5" />
        )
      ) : (
        <ChevronsUpDown className="w-3.5 h-3.5 opacity-40" />
      )}
    </button>
  )
}

function ValuesCell({ label, values }: { label: string; values?: string | null }) {
  const [expanded, setExpanded] = useState(false)

  if (!values) return <span className="text-muted-foreground/50">—</span>

  const isLong = values.length > 80
  const display = isLong && !expanded ? values.slice(0, 80) + "…" : values

  return (
    <div className="max-w-[280px]">
      <code className="text-xs text-muted-foreground break-all whitespace-pre-wrap">{display}</code>
      {isLong && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="block text-xs text-primary hover:underline mt-0.5"
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      )}
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex gap-4 items-center">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-24" />
        </div>
      ))}
    </div>
  )
}

export default function EventsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [actionFilter, setActionFilter] = useState<ActionType | "all">("all")
  const [sortField, setSortField] = useState<SortField>("date")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")

  const {
    data: events = [],
    isLoading,
    error,
    mutate,
  } = useApi<EventLog[]>("events-list", () => eventsApi.getAll())

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortField(field)
      setSortDirection("desc")
    }
  }

  const filteredAndSorted = useMemo(() => {
    let result = [...events]

    // Filter by action
    if (actionFilter !== "all") {
      result = result.filter((e) => e.action === actionFilter)
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (e) =>
          e.message.toLowerCase().includes(q) ||
          (e.oldValues && e.oldValues.toLowerCase().includes(q)) ||
          (e.newValues && e.newValues.toLowerCase().includes(q))
      )
    }

    // Sort
    result.sort((a, b) => {
      const dir = sortDirection === "asc" ? 1 : -1
      switch (sortField) {
        case "date":
          return dir * (new Date(a.date).getTime() - new Date(b.date).getTime())
        case "action":
          return dir * (a.action - b.action)
        case "message":
          return dir * a.message.localeCompare(b.message)
        default:
          return 0
      }
    })

    return result
  }, [events, actionFilter, searchQuery, sortField, sortDirection])

  // Stats
  const stats = useMemo(() => {
    const inserts = events.filter((e) => e.action === ActionType.Insert).length
    const updates = events.filter((e) => e.action === ActionType.Update).length
    const deletes = events.filter((e) => e.action === ActionType.Delete).length
    return { total: events.length, inserts, updates, deletes }
  }, [events])

  return (
    <DashboardLayout>
      <div className="glass flex flex-col h-full min-h-0">
        {/* Header */}
        <div className="sticky top-0 z-10 glass-panel border-b border-border p-4 mx-4 mt-4 sm:p-6 sm:mx-6 sm:mt-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Events</h1>
              <p className="text-muted-foreground text-sm mt-1">History of all operations and changes</p>
            </div>
            <Button
              onClick={() => mutate()}
              variant="outline"
              size="sm"
              className="self-start sm:self-auto"
            >
              <RefreshCcw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>

          {/* Stats */}
          {!isLoading && !error && events.length > 0 && (
            <div className="flex flex-wrap gap-3 mt-4">
              <div className="glass-tile px-3 py-1.5 rounded-lg text-xs">
                <span className="text-muted-foreground">Total:</span>{" "}
                <span className="font-semibold text-foreground">{stats.total}</span>
              </div>
              <div className="glass-tile px-3 py-1.5 rounded-lg text-xs">
                <span className="text-emerald-400">Inserts:</span>{" "}
                <span className="font-semibold text-foreground">{stats.inserts}</span>
              </div>
              <div className="glass-tile px-3 py-1.5 rounded-lg text-xs">
                <span className="text-blue-400">Updates:</span>{" "}
                <span className="font-semibold text-foreground">{stats.updates}</span>
              </div>
              <div className="glass-tile px-3 py-1.5 rounded-lg text-xs">
                <span className="text-red-400">Deletes:</span>{" "}
                <span className="font-semibold text-foreground">{stats.deletes}</span>
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4 sm:p-6 min-h-0">
          <Card className="glass-panel border-border h-full flex flex-col">
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl">
                    <Calendar className="w-5 h-5" />
                    Log Events
                  </CardTitle>
                  <CardDescription>Detailed log of all operations in the system</CardDescription>
                </div>

                {/* Search and filter */}
                {!isLoading && !error && events.length > 0 && (
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="events-search"
                        placeholder="Search events..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 w-full sm:w-56 h-9"
                      />
                    </div>

                    {/* Action filter buttons */}
                    <div className="flex gap-1">
                      <button
                        onClick={() => setActionFilter("all")}
                        className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                          actionFilter === "all"
                            ? "bg-primary/20 text-primary border border-primary/30"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                        }`}
                      >
                        All
                      </button>
                      {Object.entries(ACTION_CONFIG).map(([key, config]) => (
                        <button
                          key={key}
                          onClick={() => setActionFilter(Number(key) as ActionType)}
                          className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                            actionFilter === Number(key)
                              ? config.className + " border"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                          }`}
                        >
                          {config.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardHeader>

            <CardContent className="flex-1 min-h-0 overflow-auto">
              {/* Loading state */}
              {isLoading && <LoadingSkeleton />}

              {/* Error state */}
              {error && !isLoading && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <AlertCircle className="w-12 h-12 text-destructive mb-4" />
                  <p className="text-lg font-medium text-foreground">Failed to load events</p>
                  <p className="text-sm text-muted-foreground mt-1">{error.message}</p>
                  <Button onClick={() => mutate()} variant="outline" size="sm" className="mt-4">
                    <RefreshCcw className="w-4 h-4 mr-2" />
                    Retry
                  </Button>
                </div>
              )}

              {/* Empty state */}
              {!isLoading && !error && events.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                  <Calendar className="w-12 h-12 mb-4 opacity-40" />
                  <p className="text-lg font-medium text-foreground">No events yet</p>
                  <p className="text-sm mt-1">
                    Events will appear here as you create, update, and delete items and categories.
                  </p>
                </div>
              )}

              {/* No results from filter */}
              {!isLoading && !error && events.length > 0 && filteredAndSorted.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                  <Search className="w-12 h-12 mb-4 opacity-40" />
                  <p className="text-lg font-medium text-foreground">No matching events</p>
                  <p className="text-sm mt-1">Try adjusting your search or filter criteria.</p>
                </div>
              )}

              {/* Table */}
              {!isLoading && !error && filteredAndSorted.length > 0 && (
                <div className="glass-table rounded-xl overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="glass-table-header border-b border-white/10">
                        <TableHead className="w-[180px]">
                          <SortButton
                            field="date"
                            currentSort={sortField}
                            currentDirection={sortDirection}
                            onSort={handleSort}
                          >
                            Date
                          </SortButton>
                        </TableHead>
                        <TableHead className="w-[110px]">
                          <SortButton
                            field="action"
                            currentSort={sortField}
                            currentDirection={sortDirection}
                            onSort={handleSort}
                          >
                            Action
                          </SortButton>
                        </TableHead>
                        <TableHead>
                          <SortButton
                            field="message"
                            currentSort={sortField}
                            currentDirection={sortDirection}
                            onSort={handleSort}
                          >
                            Message
                          </SortButton>
                        </TableHead>
                        <TableHead className="hidden lg:table-cell">Old Values</TableHead>
                        <TableHead className="hidden lg:table-cell">New Values</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAndSorted.map((event) => (
                        <TableRow key={event.id} className="glass-table-row border-b border-white/5">
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDate(event.date)}
                          </TableCell>
                          <TableCell>
                            <ActionBadge action={event.action} />
                          </TableCell>
                          <TableCell className="text-sm text-foreground max-w-[400px]">
                            <span className="line-clamp-2">{event.message}</span>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            <ValuesCell label="Old" values={event.oldValues} />
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            <ValuesCell label="New" values={event.newValues} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {/* Result count footer */}
                  <div className="px-4 py-2.5 border-t border-white/5 text-xs text-muted-foreground">
                    Showing {filteredAndSorted.length} of {events.length} events
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}