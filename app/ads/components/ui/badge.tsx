import type React from "react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface CustomBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
}

export function ActiveBadge({ className, ...props }: CustomBadgeProps) {
  return <Badge variant="active" className={cn(className)} {...props} />
}

export function InactiveBadge({ className, ...props }: CustomBadgeProps) {
  return <Badge variant="inactive" className={cn(className)} {...props} />
}

export function MobileActiveBadge({ className, ...props }: CustomBadgeProps) {
  return <Badge variant="active" className={cn("relative -top-1", className)} {...props} />
}

export function MobileInactiveBadge({ className, ...props }: CustomBadgeProps) {
  return <Badge variant="inactive" className={cn("relative -top-1", className)} {...props} />
}
