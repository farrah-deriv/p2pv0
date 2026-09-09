"use client"

import { useEffect, useMemo, useState } from "react"
import {
  applyStablePaymentMethodOrder,
  buildSessionPaymentMethodOrderIds,
  extendSessionPaymentMethodOrderIds,
  normalizePaymentMethodId,
} from "@/lib/payment-methods/payment-method-selection-utils"

/**
 * Keeps payment-method row order stable while a sheet/modal session is active.
 *
 * Selected items stay in place (no pin-to-top). Newly loaded methods append.
 * [sessionKey] resets order when the sheet reopens / selection source changes.
 */
export function useStablePaymentMethodOrder<T>(
  methods: T[],
  sessionKey: (string | number)[] | string | number,
  getId: (item: T) => string | number,
  isActive = true,
): T[] {
  const [sessionOrderIds, setSessionOrderIds] = useState<string[] | null>(null)

  const resetKey = useMemo(() => {
    if (Array.isArray(sessionKey)) {
      return `${isActive ? "1" : "0"}:${sessionKey
        .map((id) => normalizePaymentMethodId(id))
        .filter(Boolean)
        .join(",")}`
    }
    return `${isActive ? "1" : "0"}:${String(sessionKey)}`
  }, [isActive, sessionKey])

  useEffect(() => {
    if (!isActive) {
      setSessionOrderIds(null)
      return
    }
    setSessionOrderIds(buildSessionPaymentMethodOrderIds(methods, getId))
    // eslint-disable-next-line react-hooks/exhaustive-deps -- resetKey drives session reset
  }, [resetKey])

  useEffect(() => {
    if (!isActive || sessionOrderIds == null || methods.length === 0) return
    setSessionOrderIds((prev) =>
      prev == null ? prev : extendSessionPaymentMethodOrderIds(prev, methods, getId),
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only extend when methods change
  }, [isActive, methods])

  return useMemo(() => {
    const orderIds =
      sessionOrderIds ?? buildSessionPaymentMethodOrderIds(methods, getId)
    return applyStablePaymentMethodOrder(methods, orderIds, getId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [methods, sessionOrderIds, resetKey])
}
