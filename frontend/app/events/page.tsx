"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "lucide-react"
import "@/styles/glass.css"

export default function EventsPage() {
  return (
    <DashboardLayout>
      <div className="glass flex flex-col h-full">
        {/* Header */}
        <div className="sticky top-0 z-10 glass-panel border-b border-border p-6 mx-6 mt-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Events</h1>
              <p className="text-muted-foreground text-sm mt-1">History of all operations and changes</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          <Card className="glass bg-card border-border h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Log Events
              </CardTitle>
              <CardDescription>Detailed log of all operations in the system</CardDescription>
            </CardHeader>
            <CardContent className="py-12 text-center text-muted-foreground">
              <div className="space-y-4">
                <p className="text-lg">No events available</p>
                <p className="text-sm">
                  Events will be displayed when the backend has the /api/events endpoint implemented
                </p>
                <div className="mt-6 p-4 bg-secondary rounded-lg text-left text-xs text-foreground">
                  <p className="font-semibold mb-2">Waiting for:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Endpoint GET /api/events (to list events)</li>
                    <li>Schema EventLog with id, itemId, action, description, insertDate</li>
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
