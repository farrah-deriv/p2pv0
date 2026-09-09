"use client"

import { useEffect, useRef } from "react"

/**
 * IntersectionObserver helper for infinite lists.
 * Observes [sentinelRef]; when [scrollRootRef] is attached, uses that as root.
 * Otherwise observes against the viewport (page scroll).
 */
export function useLoadMoreOnScroll(
  enabled: boolean,
  onLoadMore: (() => void) | undefined,
  isLoadingMore = false,
) {
  const scrollRootRef = useRef<HTMLDivElement | null>(null)
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const isLoadingMoreRef = useRef(isLoadingMore)
  const onLoadMoreRef = useRef(onLoadMore)

  useEffect(() => {
    isLoadingMoreRef.current = isLoadingMore
  }, [isLoadingMore])

  useEffect(() => {
    onLoadMoreRef.current = onLoadMore
  }, [onLoadMore])

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!enabled || isLoadingMore || !onLoadMoreRef.current || !sentinel) return

    const root = scrollRootRef.current
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !isLoadingMoreRef.current) {
          onLoadMoreRef.current?.()
        }
      },
      { root, rootMargin: "100px", threshold: 0 },
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
    // Re-observe when loading finishes so a still-visible sentinel can chain the
    // next page (Observer does not re-fire if intersection never left). Omit
    // onLoadMore — held in a ref to avoid identity churn mid-fetch.
  }, [enabled, isLoadingMore])

  return { scrollRootRef, sentinelRef }
}
