import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto flex flex-col items-center px-4 py-12">
        <Skeleton className="h-16 w-16 rounded-full" />
        <Skeleton className="mt-6 h-8 w-32" />
        <Skeleton className="mt-2 h-4 w-24" />

        <div className="mt-[50px] md:mt-12 flex w-full max-w-md justify-between px-4">
          <div className="flex flex-col items-center">
            <Skeleton className="h-16 w-16 rounded-full" />
            <Skeleton className="mt-2 h-4 w-16" />
          </div>

          <div className="flex flex-col items-center">
            <Skeleton className="h-16 w-16 rounded-full" />
            <Skeleton className="mt-2 h-4 w-16" />
          </div>

          <div className="flex flex-col items-center">
            <Skeleton className="h-16 w-16 rounded-full" />
            <Skeleton className="mt-2 h-4 w-16" />
          </div>
        </div>
      </div>
    </div>
  )
}
