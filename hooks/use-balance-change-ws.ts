import { useEffect } from "react"
import { useWebSocketContext, useChannelHeartbeat } from "@/contexts/websocket-context"
import { useUserDataStore } from "@/stores/user-data-store"
import { totalAccountValueSchema } from "@/services/api/api-auth"
import { parseWithSchema } from "@/lib/api/schema-coercion"
import { schemaReporter } from "@/lib/api/schema-reporter"
import { SchemaMismatchError } from "@/lib/api/schema-mismatch-error"

/**
 * Subscribes to the shared users/me WebSocket channel for balance_change
 * events. Fails closed on a malformed push (keeps the previous balance
 * rather than resetting to "0.00") and always updates the shared user-data
 * store; onBalanceUpdate is for page-local state that needs the fresh value.
 */
export function useBalanceChangeWs(onBalanceUpdate: (amount: string, currency: string) => void) {
  const { isConnected, subscribeToUserUpdates, unsubscribeFromUserUpdates, subscribe } = useWebSocketContext()

  useEffect(() => {
    if (!isConnected) return

    subscribeToUserUpdates()

    const unsubscribe = subscribe((data: any) => {
      if (data?.options?.channel?.startsWith("users/me")) {
        if (data?.payload?.data?.event === "balance_change" && data?.payload?.data?.user?.total_account_value) {
          let totalAccountValue: { amount: string; currency: string }
          try {
            totalAccountValue = parseWithSchema(
              totalAccountValueSchema,
              data.payload.data.user.total_account_value,
              { endpoint: "ws:users/me", reporter: schemaReporter },
            ) as unknown as { amount: string; currency: string }
          } catch (error) {
            if (!(error instanceof SchemaMismatchError)) {
              console.error("Unexpected error in balance_change handler", error)
            }
            return
          }

          onBalanceUpdate(totalAccountValue.amount, totalAccountValue.currency)

          const updateBalances = useUserDataStore.getState().updateBalances
          updateBalances({
            amount: totalAccountValue.amount,
            currency: totalAccountValue.currency,
          })
        }
      }
    })

    return () => {
      unsubscribe()
      unsubscribeFromUserUpdates()
    }
  }, [isConnected, subscribe, subscribeToUserUpdates, unsubscribeFromUserUpdates, onBalanceUpdate])

  useChannelHeartbeat("users/me", isConnected)
}
