"use client"

import { useTranslations } from "@/lib/i18n/use-translations"

type TranslateFn = (key: string, params?: Record<string, string | number>) => string

/** Average days per month accounting for leap years. */
const AVG_DAYS_PER_MONTH = 30.44

export function formatLastSeen(lastOnlineAt: number | null | undefined, t: TranslateFn): string {
  if (lastOnlineAt == null) return ""

  const diffMs = Date.now() - lastOnlineAt
  const minutes = Math.floor(diffMs / 60000)

  if (minutes < 1) return t("presence.seenJustNow")

  if (minutes < 60) {
    return t("presence.seenMinutesAgo", {
      count: minutes,
      plural: minutes === 1 ? "" : "s",
    })
  }

  const hours = Math.floor(minutes / 60)
  if (hours < 24) {
    return t("presence.seenHoursAgo", {
      count: hours,
      plural: hours === 1 ? "" : "s",
    })
  }

  const days = Math.floor(hours / 24)
  if (days < 30) {
    return t("presence.seenDaysAgo", {
      count: days,
      plural: days === 1 ? "" : "s",
    })
  }

  const months = Math.round(days / AVG_DAYS_PER_MONTH)
  if (months <= 6) {
    const clamped = Math.max(1, months)
    return t("presence.seenMonthsAgo", {
      count: clamped,
      plural: clamped === 1 ? "" : "s",
    })
  }

  return t("presence.seenMoreThanSixMonthsAgo")
}

interface PresenceLastSeenProps {
  isOnline?: boolean
  lastOnlineAt?: number | null
  className?: string
}

export function PresenceLastSeen({ isOnline, lastOnlineAt, className }: PresenceLastSeenProps) {
  const { t } = useTranslations()

  if (isOnline) return null

  const text = formatLastSeen(lastOnlineAt, t)
  if (!text) return null

  return (
    <span className={className ?? "text-xs text-grayscale-600"}>
      {text}
    </span>
  )
}
