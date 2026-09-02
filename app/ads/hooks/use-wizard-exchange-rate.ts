"use client"

import { useEffect, useMemo, useRef, useState } from "react"
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
  isExplicitlyUnavailable: boolean
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
  const cachedRatesRef = useRef<Record<string, number>>({})

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

  useEffect(() => {
    if (!enabled || !isConnected || !buyCurrency) return

    joinExchangeRatesChannel(buyCurrency, ALL_EXCHANGE_RATES)
    return () => {
      leaveExchangeRatesChannel(buyCurrency, ALL_EXCHANGE_RATES)
    }
  }, [
    enabled,
    isConnected,
    buyCurrency,
    joinExchangeRatesChannel,
    leaveExchangeRatesChannel,
  ])

  useEffect(() => {
    if (!enabled || !isConnected || !buyCurrency || !paymentCurrency) return

    const accountChannel = `exchange_rates/${buyCurrency}`
    // The WebSocket client queues rate requests until the channel join is
    // ready for this socket generation, including after reconnect. Do not use
    // a component-level timer here: it can fire before server membership is
    // registered and produces "must be in the channel" errors.
    requestExchangeRate(buyCurrency, ALL_EXCHANGE_RATES)

    const settleTimer = setTimeout(() => {
      setLoadingPair((current) => current === pairKey ? null : current)
    }, RATE_SETTLE_DELAY_MS)

    const unsubscribe = subscribe((message: WebSocketMessage) => {
      const channel = message.options?.channel
      if (!channel?.startsWith(accountChannel)) return

      const updates = extractExchangeRateUpdates(message.payload, channel, paymentCurrency)
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

      if (updates[paymentCurrency]) {
        setLoadingPair((current) => current === pairKey ? null : current)
      }
    })

    return () => {
      clearTimeout(settleTimer)
      unsubscribe()
    }
  }, [
    enabled,
    isConnected,
    buyCurrency,
    paymentCurrency,
    pairKey,
    requestExchangeRate,
    subscribe,
  ])

  useEffect(() => {
    if (isConnected || !enabled || !pairKey) return
    const timer = setTimeout(() => {
      setLoadingPair((current) => current === pairKey ? null : current)
    }, RATE_SETTLE_DELAY_MS)
    return () => clearTimeout(timer)
  }, [enabled, isConnected, pairKey])

  return useMemo(() => {
    const rate = selectedUpdate?.rate ?? null
    const status = selectedUpdate?.status ?? null
    return {
      pairKey,
      rate,
      cachedRate: pairKey ? cachedRatesRef.current[pairKey] ?? rate : null,
      status,
      isLoading: loadingPair === pairKey,
      isExplicitlyUnavailable: isExplicitlyUnavailableRate(status),
    }
  }, [pairKey, selectedUpdate, loadingPair])
}
