"use client"

import { Skeleton } from "@/components/ui/skeleton"

export function AdDetailsFormSkeleton() {
  return (
    <div className="space-y-6 py-6">
      <div className="space-y-2">
        <Skeleton className="bg-grayscale-500 h-4 w-24" />
        <Skeleton className="bg-grayscale-500 h-12 w-full" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Skeleton className="bg-grayscale-500 h-4 w-32" />
          <Skeleton className="bg-grayscale-500 h-14 w-full rounded-lg" />
        </div>
        <div className="space-y-2">
          <Skeleton className="bg-grayscale-500 h-4 w-32" />
          <Skeleton className="bg-grayscale-500 h-14 w-full rounded-lg" />
        </div>
      </div>

      <Skeleton className="bg-grayscale-500 h-px w-full" />

      <div className="space-y-4">
        <Skeleton className="bg-grayscale-500 h-12 w-full" />
        <div className="space-y-2">
          <Skeleton className="bg-grayscale-500 h-4 w-40" />
          <Skeleton className="bg-grayscale-500 h-14 w-full rounded-lg" />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between">
            <Skeleton className="bg-grayscale-500 h-3 w-32" />
            <Skeleton className="bg-grayscale-500 h-3 w-24" />
          </div>
          <div className="flex justify-between">
            <Skeleton className="bg-grayscale-500 h-3 w-32" />
            <Skeleton className="bg-grayscale-500 h-3 w-24" />
          </div>
          <div className="flex justify-between">
            <Skeleton className="bg-grayscale-500 h-3 w-32" />
            <Skeleton className="bg-grayscale-500 h-3 w-24" />
          </div>
        </div>
      </div>

      <Skeleton className="bg-grayscale-500 h-px w-full" />

      <div className="space-y-4">
        <Skeleton className="bg-grayscale-500 h-6 w-48" />
        <div className="space-y-2">
          <Skeleton className="bg-grayscale-500 h-4 w-32" />
          <Skeleton className="bg-grayscale-500 h-14 w-full rounded-lg" />
        </div>
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex-1 space-y-2">
            <Skeleton className="bg-grayscale-500 h-4 w-32" />
            <Skeleton className="bg-grayscale-500 h-14 w-full rounded-lg" />
          </div>
          <Skeleton className="bg-grayscale-500 h-6 w-4 hidden md:block" />
          <div className="flex-1 space-y-2">
            <Skeleton className="bg-grayscale-500 h-4 w-32" />
            <Skeleton className="bg-grayscale-500 h-14 w-full rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  )
}
