"use client"

import { Skeleton } from "@/components/ui/skeleton"

export function AdvertiserSkeleton() {
  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6 md:px-2 md:py-0">
        <div className="flex flex-col md:flex-row justify-between">
          <div className="container mx-auto pb-6">
            <div className="bg-slate-75 p-6 rounded-b-3xl md:rounded-3xl flex flex-col md:items-start gap-4 mx-[-24px] mt-[-24px] md:mx-0 md:mt-0">
              <Skeleton className="bg-grayscale-500 h-10 w-10 rounded" />
              
              <div className="flex-1 w-full">
                <div className="flex flex-col md:flex-row gap-2 md:gap-0">
                  <div className="relative me-[16px]">
                    <Skeleton className="h-[56px] w-[56px] rounded-full" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex gap-2 items-center mb-2">
                      <Skeleton className="bg-grayscale-500 h-6 w-32" />
                      <Skeleton className="bg-grayscale-500 h-4 w-4 rounded-full" />
                      <Skeleton className="bg-grayscale-500 h-4 w-4 rounded-full" />
                    </div>
                    
                    <div className="flex items-center text-xs gap-2 mb-2">
                      <Skeleton className="bg-grayscale-500 h-3 w-16" />
                      <Skeleton className="bg-grayscale-500 h-3 w-24" />
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Skeleton className="bg-grayscale-500 h-3 w-32" />
                      <span className="opacity-[0.08]">|</span>
                      <Skeleton className="bg-grayscale-500 h-3 w-24" />
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 md:mt-0">
                    <Skeleton className="bg-grayscale-500 h-8 w-24 rounded" />
                    <Skeleton className="bg-grayscale-500 h-8 w-20 rounded" />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="bg-slate-75 p-4 rounded-lg space-y-2">
                    <Skeleton className="bg-grayscale-500 h-3 w-20" />
                    <Skeleton className="bg-grayscale-500 h-6 w-24" />
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6">
              <Skeleton className="bg-grayscale-500 h-6 w-32 mb-4" />
              
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white border border-slate-200 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                      <Skeleton className="bg-grayscale-500 h-4 w-20" />
                      <Skeleton className="bg-grayscale-500 h-4 w-24" />
                      <Skeleton className="bg-grayscale-500 h-4 w-16" />
                      <Skeleton className="bg-grayscale-500 h-4 w-28" />
                      <Skeleton className="bg-grayscale-500 h-8 w-16 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
