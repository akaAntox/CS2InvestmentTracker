"use client"

import { useRouter, useParams } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ItemForm } from "@/components/item-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useApi } from "@/hooks/use-api"
import { itemsApi, categoriesApi } from "@/lib/api-client"
import { ChevronLeft, BarChart3 } from "lucide-react"
import Link from "next/link"
import { Skeleton } from "@/components/ui/skeleton"

export default function ItemDetailPage() {
  const router = useRouter()
  const params = useParams()
  const itemId = params.id as string

  const { data: item, isLoading: itemLoading } = useApi(`item-${itemId}`, () => itemsApi.getById(itemId))

  const { data: categories = [] } = useApi("categories-detail", () => categoriesApi.getAll())

  if (itemLoading) {
    return (
      <DashboardLayout>
        <div className="p-6 space-y-4">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-96 w-full" />
        </div>
      </DashboardLayout>
    )
  }

  if (!item) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <p className="text-destructive">Articolo non trovato</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background border-b border-border p-6">
          <div className="flex items-center gap-3">
            <Link href="/items" className="text-muted-foreground hover:text-foreground">
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-foreground">{item.name}</h1>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="details">Dettagli</TabsTrigger>
              <TabsTrigger value="prices">Prezzi</TabsTrigger>
              <TabsTrigger value="log">Storico</TabsTrigger>
            </TabsList>

            {/* Details Tab */}
            <TabsContent value="details" className="space-y-4">
              <ItemForm
                item={item}
                categories={categories}
                onSubmit={() => router.push("/items")}
                onCancel={() => router.back()}
              />
            </TabsContent>

            {/* Prices Tab */}
            <TabsContent value="prices">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Storico Prezzi
                  </CardTitle>
                  <CardDescription>Grafico dei prezzi nel tempo (placeholder)</CardDescription>
                </CardHeader>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <p>Nessun dato disponibile al momento</p>
                  <p className="text-sm mt-2">I dati storici verranno visualizzati quando disponibili da Steam API</p>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Log Tab */}
            <TabsContent value="log">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle>Storico Modifiche</CardTitle>
                  <CardDescription>Log di tutte le modifiche effettuate</CardDescription>
                </CardHeader>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <p>Nessun evento registrato</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </DashboardLayout>
  )
}
