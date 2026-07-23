"use client"

import { type RefObject, useEffect, useRef } from "react"

/**
 * When selection count first hits [maxSelected], scroll the list root to top
 * so the selected-methods section stays in view.
 */
export function useScrollToTopOnMaxSelection(
  scrollRootRef: RefObject<HTMLElement | null>,
  selectedCount: number,
  options?: {
    maxSelected?: number
    /** Bump when list layout changes so scroll runs after paint. */
    listVersion?: number | string
  },
) {
  const maxSelected = options?.maxSelected ?? 3
  const listVersion = options?.listVersion
  const prevCountRef = useRef(selectedCount)

  useEffect(() => {
    const hitMax = selectedCount >= maxSelected && prevCountRef.current < maxSelected
    prevCountRef.current = selectedCount
    if (!hitMax) return

    let cancelled = false
    const tryScroll = () => {
      if (cancelled) return
      const root = scrollRootRef.current
      if (!root) return
      root.scrollTop = 0
    }

    requestAnimationFrame(tryScroll)

    return () => {
      cancelled = true
    }
  }, [selectedCount, maxSelected, scrollRootRef, listVersion])
}
