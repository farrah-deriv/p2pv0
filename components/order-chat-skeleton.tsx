import { Skeleton } from "@/components/ui/skeleton"

export default function OrderChatSkeleton() {
  return (
    <div className="flex flex-col h-full overflow-auto">
      <div className="flex items-center p-4 border-b">
        <Skeleton className="w-10 h-10 rounded-full me-3" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>

      <div className="h-full overflow-auto">
        <div className="p-[16px] m-[16px]">
          <Skeleton className="h-[120px] w-full rounded-[16px]" />
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
         
          <div className="flex justify-center my-4">
            <Skeleton className="h-6 w-32 rounded-full" />
          </div>

          <div className="flex justify-start">
            <div className="max-w-[80%] space-y-2">
              <Skeleton className="h-16 w-64" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>

          <div className="flex justify-end">
            <div className="max-w-[80%] space-y-2">
              <Skeleton className="h-16 w-48" />
              <Skeleton className="h-3 w-16 ms-auto" />
            </div>
          </div>

          <div className="flex justify-start">
            <div className="max-w-[80%] space-y-2">
              <Skeleton className="h-20 w-56" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>

          <div className="flex justify-end">
            <div className="max-w-[80%] space-y-2">
              <Skeleton className="h-12 w-40" />
              <Skeleton className="h-3 w-16 ms-auto" />
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 border-t bg-slate-75">
        <div className="space-y-2">
          <Skeleton className="h-14 w-full" />
          <div className="flex justify-between items-center">
            <div />
            <Skeleton className="h-3 w-12" />
          </div>
        </div>
      </div>
    </div>
  )
}
