"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useWebSocketContext } from "@/contexts/websocket-context"
import type { WebSocketMessage } from "@/lib/websocket-message"
import {
  extractExchangeRateUpdates,
  isExplicitlyUnavailableRate,
  type ExchangeRateUpdate,
} from "@/lib/ads/exchange-rate-recovery"

const ALL_EXCHANGE_RATES = ""
const RATE_SETTLE_DELAY_MS = 1500

export interface WizardExchangeRateState {
  pairKey: string
  rate: number | null
  cachedRate: number | null
  status: string | null
  isLoading: boolean
  /**
   * An update for this pair has actually been received, so `status` reflects the
   * feed rather than "nothing has arrived yet".
   *
   * Deliberately separate from `isLoading`: the settle timer clears `isLoading`
   * whether or not the feed ever answered, so `!isLoading` alone cannot be used to
   * decide anything that depends on the status being *known*. Callers that must
   * not paint the wrong thing (the edit wizard's rate section) gate on this;
   * `hasSettled` is the upper bound that stops a silent feed blocking forever.
   */
  hasResolvedStatus: boolean
  /** The settle timer for this pair expired without an update arriving. */
  hasSettled: boolean
  isExplicitlyUnavailable: boolean
  /**
   * The cached rate for an arbitrary pair, or null.
   *
   * `cachedRate` above is keyed off this hook's own `pairKey`, which stays empty
   * until the caller knows the payment currency. The edit prefill has to read the
   * advert's pair in the very tick that first sets it, so it cannot wait for
   * `pairKey` to catch up — hence the explicit lookup.
   */
  getCachedRate: (pairKey: string) => number | null
}

export function useWizardExchangeRate(
  buyCurrency: string | undefined,
  paymentCurrency: string | undefined,
  enabled = true,
): WizardExchangeRateState {
  const {
    isConnected,
    joinExchangeRatesChannel,
    leaveExchangeRatesChannel,
    requestExchangeRate,
    subscribe,
  } = useWebSocketContext()
  const [updatesByPair, setUpdatesByPair] = useState<Record<string, ExchangeRateUpdate>>({})
  const [loadingPair, setLoadingPair] = useState<string | null>(null)
  const [settledPair, setSettledPair] = useState<string | null>(null)
  const cachedRatesRef = useRef<Record<string, number>>({})
  // Read by the feed subscription instead of being a dependency of it: the payment
  // currency only narrows which update clears `isLoading`, and re-subscribing on
  // every change would restart the join/request round trip for no reason.
  const paymentCurrencyRef = useRef(paymentCurrency)
  paymentCurrencyRef.current = paymentCurrency

  const pairKey = buyCurrency && paymentCurrency ? `${buyCurrency}:${paymentCurrency}` : ""
  const selectedUpdate = pairKey ? updatesByPair[pairKey] : undefined

  useEffect(() => {
    if (!enabled || !pairKey) {
      setLoadingPair(null)
      return
    }
    if (selectedUpdate) {
      setLoadingPair(null)
      return
    }
    setLoadingPair(pairKey)
  }, [enabled, pairKey, selectedUpdate])

  // Deliberately gated on the socket and the account currency ALONE — not on
  // `enabled`, not on the payment currency. The channel is keyed by account currency
  // and requestExchangeRate asks for ALL_EXCHANGE_RATES, so neither the advert load
  // nor the payment currency is needed to start the round trip. Waiting for them is
  // what left the edit wizard with no rate in hand at prefill time, and so with a
  // fixed field that painted empty and filled a second later.
  useEffect(() => {
    if (!isConnected || !buyCurrency) return

    const accountChannel = `exchange_rates/${buyCurrency}`
    joinExchangeRatesChannel(buyCurrency, ALL_EXCHANGE_RATES)
    // The WebSocket client queues rate requests until the channel join is
    // ready for this socket generation, including after reconnect. Do not use
    // a component-level timer here: it can fire before server membership is
    // registered and produces "must be in the channel" errors.
    requestExchangeRate(buyCurrency, ALL_EXCHANGE_RATES)

    const unsubscribe = subscribe((message: WebSocketMessage) => {
      const channel = message.options?.channel
      if (!channel?.startsWith(accountChannel)) return

      const updates = extractExchangeRateUpdates(
        message.payload,
        channel,
        paymentCurrencyRef.current ?? "",
      )
      if (Object.keys(updates).length === 0) return

      for (const [currency, update] of Object.entries(updates)) {
        if (update.rate !== undefined) {
          cachedRatesRef.current[`${buyCurrency}:${currency}`] = update.rate
        }
      }

      setUpdatesByPair((current) => {
        const next = { ...current }
        for (const [currency, update] of Object.entries(updates)) {
          const updatePair = `${buyCurrency}:${currency}`
          const previous = next[updatePair]
          next[updatePair] = {
            rate: update.rate ?? previous?.rate,
            status: update.status ?? previous?.status,
          }
        }
        return next
      })

      const selectedCurrency = paymentCurrencyRef.current
      if (selectedCurrency && updates[selectedCurrency]) {
        const updatedPair = `${buyCurrency}:${selectedCurrency}`
        setLoadingPair((current) => current === updatedPair ? null : current)
      }
    })

    return () => {
      unsubscribe()
      leaveExchangeRatesChannel(buyCurrency, ALL_EXCHANGE_RATES)
    }
  }, [
    isConnected,
    buyCurrency,
    joinExchangeRatesChannel,
    leaveExchangeRatesChannel,
    requestExchangeRate,
    subscribe,
  ])

  // Pair-scoped upper bound on waiting for the feed. It gives up whether or not an
  // update ever arrives — which is why `hasSettled` is exposed separately from
  // `hasResolvedStatus` and why callers that must not paint the wrong thing gate on
  // the latter. Covers the disconnected case too: no socket means no update, so the
  // timer is the only thing that can release `isLoading`.
  useEffect(() => {
    if (!enabled || !pairKey || selectedUpdate) return
    const timer = setTimeout(() => {
      setLoadingPair((current) => current === pairKey ? null : current)
      setSettledPair(pairKey)
    }, RATE_SETTLE_DELAY_MS)
    return () => clearTimeout(timer)
  }, [enabled, pairKey, selectedUpdate])

  const getCachedRate = useCallback((key: string) => {
    const cached = key ? cachedRatesRef.current[key] : undefined
    return typeof cached === "number" ? cached : null
  }, [])

  return useMemo(() => {
    const rate = selectedUpdate?.rate ?? null
    const status = selectedUpdate?.status ?? null
    return {
      pairKey,
      rate,
      cachedRate: pairKey ? cachedRatesRef.current[pairKey] ?? rate : null,
      status,
      isLoading: loadingPair === pairKey,
      hasResolvedStatus: !!pairKey && selectedUpdate !== undefined,
      hasSettled: !!pairKey && settledPair === pairKey,
      isExplicitlyUnavailable: isExplicitlyUnavailableRate(status),
      getCachedRate,
    }
  }, [pairKey, selectedUpdate, loadingPair, settledPair, getCachedRate])
}
