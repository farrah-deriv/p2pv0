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
const JOIN_REQUEST_DELAY_MS = 400

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
  const joinedCurrencyRef = useRef<string | null>(null)

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

    joinedCurrencyRef.current = null
    joinExchangeRatesChannel(buyCurrency, ALL_EXCHANGE_RATES)
    return () => {
      joinedCurrencyRef.current = null
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
    let requestTimer: ReturnType<typeof setTimeout> | undefined
    if (joinedCurrencyRef.current === buyCurrency) {
      requestExchangeRate(buyCurrency, ALL_EXCHANGE_RATES)
    } else {
      requestTimer = setTimeout(() => {
        joinedCurrencyRef.current = buyCurrency
        requestExchangeRate(buyCurrency, ALL_EXCHANGE_RATES)
      }, JOIN_REQUEST_DELAY_MS)
    }

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
      clearTimeout(requestTimer)
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
