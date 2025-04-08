import type React from "react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface StatusBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  status: "active" | "inactive" | "pending" | "completed" | "cancelled" | "disputed" | string
  className?: string
}

export function StatusBadge({ status, className, ...props }: StatusBadgeProps) {
  const statusMap: Record<string, { variant: string; label: string }> = {
    active: { variant: "success-light", label: "Active" },
    inactive: { variant: "error-light", label: "Inactive" },
    pending: { variant: "pending", label: "Pending" },
    completed: { variant: "completed", label: "Completed" },
    cancelled: { variant: "cancelled", label: "Cancelled" },
    disputed: { variant: "disputed", label: "Disputed" },
  }

  const { variant, label } = statusMap[status.toLowerCase()] || statusMap.inactive

  return (
    <Badge variant={variant as any} className={cn("rounded-md", className)} {...props}>
      {label}
    </Badge>
  )
}

export default StatusBadge
