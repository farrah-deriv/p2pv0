import type React from "react"
import { AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface EmptyStateProps {
  icon?: React.ReactNode
  title?: string
  description?: string
  className?: string
  iconClassName?: string
}

export function EmptyState({
  icon,
  title = "No ads available.",
  description,
  className,
  iconClassName,
}: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-8", className)}>
      <div className={cn("w-16 h-16 rounded-full bg-slate-200 flex items-center justify-center mb-4", iconClassName)}>
        {icon || <AlertCircle className="h-8 w-8 text-slate-400" />}
      </div>
      {title && <p className="text-xl font-medium text-slate-800">{title}</p>}
      {description && <p className="text-sm text-slate-500 mt-2 text-center max-w-md">{description}</p>}
    </div>
  )
}

