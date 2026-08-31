"use client"

import { useEffect, useState } from "react"

/**
 * Returns `value` once it has stopped changing for `delay` ms.
 *
 * Needed by any search box that feeds a React Query key: a distinct key is a distinct
 * query, so an undebounced input would fire one request per keystroke.
 */
export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timeoutId = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timeoutId)
  }, [value, delay])

  return debouncedValue
}
