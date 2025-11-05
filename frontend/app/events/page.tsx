"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "lucide-react"

export default function EventsPage() {
  return (
    <DashboardLayout>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background border-b border-border p-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Eventi</h1>
            <p className="text-muted-foreground text-sm mt-1">Storico di tutte le operazioni e modifiche</p>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          <Card className="bg-card border-border h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Log Eventi
              </CardTitle>
              <CardDescription>Registro dettagliato di tutte le operazioni nel sistema</CardDescription>
            </CardHeader>
            <CardContent className="py-12 text-center text-muted-foreground">
              <div className="space-y-4">
                <p className="text-lg">Nessun evento disponibile</p>
                <p className="text-sm">
                  Gli eventi verranno visualizzati quando il backend avrà l'endpoint /api/events implementato
                </p>
                <div className="mt-6 p-4 bg-secondary rounded-lg text-left text-xs text-foreground">
                  <p className="font-semibold mb-2">In attesa di:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Endpoint GET /api/events (per listare gli eventi)</li>
                    <li>Schema EventLog con id, itemId, action, description, insertDate</li>
                    <li>Integrazione con modifiche di Items e Categories</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
