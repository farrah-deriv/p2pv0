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

  useEffect(() => {
    isLoadingMoreRef.current = isLoadingMore
  }, [isLoadingMore])

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!enabled || !onLoadMore || !sentinel) return

    const root = scrollRootRef.current
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !isLoadingMoreRef.current) {
          onLoadMore()
        }
      },
      { root, rootMargin: "100px", threshold: 0 },
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [enabled, onLoadMore])

  return { scrollRootRef, sentinelRef }
}
