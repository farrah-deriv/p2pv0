"use client"

import { Chip } from "@deriv-com/quill-ui-v2"
import { useTranslations } from "@/lib/i18n/use-translations"
import { cn } from "@/lib/utils"

interface OrderTimeLimitSelectorProps {
  value: number
  onValueChange: (value: number) => void
  className?: string
}

const TIME_LIMIT_OPTIONS = [15, 30, 45, 60] as const

export default function OrderTimeLimitSelector({
  value,
  onValueChange,
  className,
}: OrderTimeLimitSelectorProps) {
  const { t } = useTranslations()

  const labelFor = (minutes: number) => {
    switch (minutes) {
      case 15:
        return t("adForm.timeLimit15Minutes")
      case 30:
        return t("adForm.timeLimit30Minutes")
      case 45:
        return t("adForm.timeLimit45Minutes")
      case 60:
        return t("adForm.timeLimit60Minutes")
      default:
        return `${minutes}`
    }
  }

  return (
    <div className={cn("flex items-center gap-2", className)} data-testid="ad-form-select-time-limit">
      {TIME_LIMIT_OPTIONS.map((option) => (
        <Chip
          key={option}
          label={labelFor(option)}
          state={option === value ? "selected" : "default"}
          onClick={() => onValueChange(option)}
          className="flex-1"
        />
      ))}
    </div>
  )
}
