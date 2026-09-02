"use client"

import { useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useWebSocketContext } from "@/contexts/websocket-context"
import { queryKeys } from "@/hooks/use-api-queries"
import { fetchUserIdAndStore } from "@/services/api/api-auth"

export function ReconnectionRefetchController() {
  const { onReconnect } = useWebSocketContext()
  const queryClient = useQueryClient()

  useEffect(() => {
    return onReconnect(() => {
      fetchUserIdAndStore().catch((err) => {
        console.warn("Reconnect: failed to refresh profile/balance:", err)
      })
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.buySell.advertisements() })
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.totalBalance() })
    })
  }, [onReconnect, queryClient])

  return null
}
