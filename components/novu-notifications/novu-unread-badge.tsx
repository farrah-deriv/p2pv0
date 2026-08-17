"use client"

import { cn } from "@/lib/utils"

/**
 * Numeric unread badge for the Novu bell.
 * Caps display at 99+ so wide double-digit counts don't overflow the icon.
 */
export function NovuUnreadBadge({
  count,
  className,
  "aria-label": ariaLabel,
}: {
  count: number
  className?: string
  "aria-label"?: string
}) {
  if (count <= 0) return null

  return (
    <span
      className={cn(
        "pointer-events-none absolute -end-0.5 -top-0.5 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-notification-badge px-1 text-[10px] font-semibold leading-none text-white",
        className,
      )}
      aria-label={ariaLabel}
      data-testid="notifications-unread-badge"
    >
      {count > 99 ? "99+" : String(count)}
    </span>
  )
}
