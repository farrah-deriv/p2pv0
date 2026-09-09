import { Button } from "@/components/ui/button"
import Image from "next/image"
import { cn } from "@/lib/utils"

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  className?: string
}

export function Pagination({ currentPage, totalPages, onPageChange, className }: PaginationProps) {
  if (totalPages <= 1) return null

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
  const visiblePages = pages.filter((page) => {
    if (totalPages <= 5) return true
    if (page === 1 || page === totalPages) return true
    if (Math.abs(page - currentPage) <= 1) return true
    return false
  })

  return (
    <div className={cn("flex items-center justify-center gap-2 mt-6 mb-4", className)}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="h-8 w-8 p-0"
      >
        <Image src="/icons/chevron-left.svg" alt="Previous" width={16} height={16} className="rtl:rotate-180" />
      </Button>

      <div className="flex gap-1">
        {visiblePages.map((page, index) => {
          const prevPage = visiblePages[index - 1]
          const showEllipsis = prevPage && page - prevPage > 1

          return (
            <div key={page} className="flex gap-1">
              {showEllipsis && <span className="px-2 py-1 text-gray-500">...</span>}
              <Button
                variant={page === currentPage ? "default" : "outline"}
                size="sm"
                onClick={() => onPageChange(page)}
                className="h-8 min-w-8 px-2"
              >
                {page}
              </Button>
            </div>
          )
        })}
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="h-8 w-8 p-0"
      >
        <Image src="/icons/chevron-right.svg" alt="Next" width={16} height={16} className="rtl:rotate-180" />
      </Button>
    </div>
  )
}
