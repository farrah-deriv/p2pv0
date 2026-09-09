"use client"

import { Skeleton } from "@/components/ui/skeleton"

/** Skeleton for create/edit-ad rate type + input + info rows while WS loads. */
export function RateSectionSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-live="polite">
      <Skeleton className="bg-grayscale-500 h-5 w-20" />
      <Skeleton className="bg-grayscale-500 h-14 w-full rounded-lg" />
      <Skeleton className="bg-grayscale-500 h-14 w-full rounded-lg" />
      <div className="space-y-2 pt-1">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <Skeleton className="bg-grayscale-500 h-3 w-28 shrink-0" />
            <Skeleton className="bg-grayscale-500 h-px flex-1 min-w-[8px]" />
            <Skeleton className="bg-grayscale-500 h-3 w-24 shrink-0" />
          </div>
        ))}
      </div>
    </div>
  )
}
