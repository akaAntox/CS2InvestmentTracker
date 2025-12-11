"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "lucide-react"
import "@/styles/glass.css"

export default function EventsPage() {
  return (
    <DashboardLayout>
      <div className="glass flex flex-col h-full min-h-0">
        {/* Header - Margini e padding ridotti su mobile (mx-4, p-4) -> desktop (mx-6, p-6) */}
        <div className="sticky top-0 z-10 glass-panel border-b border-border p-4 mx-4 mt-4 sm:p-6 sm:mx-6 sm:mt-6">
          <div className="flex items-center justify-between">
            <div>
              {/* Testo più piccolo su mobile (text-2xl) -> desktop (text-3xl) */}
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Events</h1>
              <p className="text-muted-foreground text-sm mt-1">History of all operations and changes</p>
            </div>
          </div>
        </div>

        {/* Content - Padding ridotto su mobile */}
        <div className="flex-1 overflow-auto p-4 sm:p-6 min-h-0">
          <Card className="glass bg-card border-border h-full flex flex-col">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl">
                <Calendar className="w-5 h-5" />
                Log Events
              </CardTitle>
              <CardDescription>Detailed log of all operations in the system</CardDescription>
            </CardHeader>
            
            {/* CardContent che riempie lo spazio rimanente per centrare il contenuto placeholder */}
            <CardContent className="flex-1 flex flex-col items-center justify-center py-8 sm:py-12 text-center text-muted-foreground">
              <div className="space-y-4 max-w-md w-full">
                <p className="text-lg font-medium text-foreground">No events available</p>
                <p className="text-sm px-4">
                  Events will be displayed when the backend has the <code className="text-primary bg-primary/10 px-1 rounded">/api/events</code> endpoint implemented
                </p>
                
                <div className="mt-6 p-4 bg-secondary/50 rounded-lg text-left text-xs sm:text-sm text-foreground border border-border">
                  <p className="font-semibold mb-2">Waiting for:</p>
                  <ul className="list-disc list-inside space-y-1.5 opacity-90">
                    <li>Endpoint <span className="font-mono text-primary">GET /api/events</span> (to list events)</li>
                    <li>Schema <span className="font-mono">EventLog</span> with id, itemId, action, description, insertDate</li>
                    <li>Integration with changes to Items and Categories</li>
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