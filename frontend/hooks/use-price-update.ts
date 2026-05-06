"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import * as signalR from "@microsoft/signalr"
import { steamApi } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"

const getHubUrl = () => {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api"
  return `${base}/hubs/priceUpdate`
}

interface UsePriceUpdateOptions {
  /** Called after the backend signals that the batch update has finished. */
  onCompleted?: () => void
}

export interface PriceUpdateState {
  isUpdating: boolean
  updateProgress: number   // 0–100
  processedCount: number | null
  totalCount: number | null
  handleUpdatePrices: () => Promise<void>
}

/**
 * Manages the SignalR connection to PriceUpdateHub and exposes price-update
 * state + the trigger function. Safe to use on multiple pages simultaneously
 * (each mounts its own connection).
 */
export function usePriceUpdate({ onCompleted }: UsePriceUpdateOptions = {}): PriceUpdateState {
  const { toast } = useToast()

  const [isUpdating, setIsUpdating]       = useState(false)
  const [updateProgress, setUpdateProgress] = useState(0)
  const [processedCount, setProcessedCount] = useState<number | null>(null)
  const [totalCount, setTotalCount]         = useState<number | null>(null)

  // Keep a stable ref to the callback so the effect doesn't need to re-run
  const onCompletedRef = useRef(onCompleted)
  useEffect(() => { onCompletedRef.current = onCompleted }, [onCompleted])

  useEffect(() => {
    const connection = new signalR.HubConnectionBuilder()
      .withUrl(getHubUrl())
      .withAutomaticReconnect()
      .build()

    connection.on("PriceUpdateProgress", (payload: { processed: number; total: number }) => {
      setIsUpdating(true)
      setProcessedCount(payload.processed)
      setTotalCount(payload.total)
      const pct = payload.total > 0 ? (payload.processed / payload.total) * 100 : 0
      setUpdateProgress(pct)
    })

    connection.on("PriceUpdateCompleted", (payload: { total: number }) => {
      setUpdateProgress(100)
      setIsUpdating(false)
      onCompletedRef.current?.()

      toast({
        title: "Update completed",
        description: `Steam prices updated for ${payload.total} items.`,
      })

      // Reset progress bar after a short visual delay
      setTimeout(() => {
        setUpdateProgress(0)
        setProcessedCount(null)
        setTotalCount(null)
      }, 1500)
    })

    // Sync state if an update was already running when this page mounted
    connection.on("UpdateStatus", (payload: { isUpdating: boolean; processed: number; total: number }) => {
      if (payload.isUpdating) {
        setIsUpdating(true)
        setProcessedCount(payload.processed)
        setTotalCount(payload.total)
        const pct = payload.total > 0 ? (payload.processed / payload.total) * 100 : 0
        setUpdateProgress(pct)
      }
    })

    connection
      .start()
      .then(() => connection.invoke("GetCurrentStatus").catch(err => console.error(err)))
      .catch(err => console.error("SignalR connection error:", err))

    return () => { connection.stop() }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // intentionally empty — connection is created once; callbacks use refs

  const handleUpdatePrices = useCallback(async () => {
    if (isUpdating) return

    setIsUpdating(true)
    setUpdateProgress(0)

    try {
      toast({
        title: "Update started",
        description: "Steam prices are being updated in the background.",
      })
      await steamApi.updateAll()
    } catch (error) {
      console.error("Error starting price update:", error)
      toast({
        title: "Attention",
        description: "Could not start the update. Check the progress bar.",
        variant: "destructive",
      })
      // Only reset if the server never acknowledged — SignalR will manage the
      // state otherwise.
      setIsUpdating(false)
    }
  }, [isUpdating, toast])

  return { isUpdating, updateProgress, processedCount, totalCount, handleUpdatePrices }
}
