import { Skeleton } from "@/components/ui/skeleton"

interface AdvertiserSearchSkeletonProps {
    count?: number
}

export function AdvertiserSearchSkeleton({ count = 5 }: AdvertiserSearchSkeletonProps) {
    return (
        <div className="px-4 py-2 space-y-3">
            {[...Array(count)].map((_, i) => (
                <div key={i} className="py-3 border-b border-slate-100">
                    <div className="flex items-center gap-2 mb-2">
                        <Skeleton className="h-[24px] w-[24px] rounded-full flex-shrink-0 bg-grayscale-200" />
                        <div className="flex flex-col gap-1 flex-1">
                            <div className="flex items-center gap-2">
                                <Skeleton className="h-4 w-36 bg-grayscale-200" />
                                <Skeleton className="h-4 w-12 bg-grayscale-200" />
                            </div>
                            <Skeleton className="h-3 w-48 bg-grayscale-200" />
                        </div>
                    </div>
                    <div className="mb-2">
                        <Skeleton className="h-5 w-32 bg-grayscale-200 mb-1" />
                        <Skeleton className="h-3 w-48 bg-grayscale-200" />
                        <Skeleton className="h-6 w-20 bg-grayscale-200 mt-2 rounded" />
                    </div>
                    <div className="flex gap-2">
                        <Skeleton className="h-3 w-24 bg-grayscale-200" />
                        <Skeleton className="h-3 w-20 bg-grayscale-200" />
                    </div>
                </div>
            ))}
        </div>
    )
}
