"use client"

import { Chip } from "@deriv-com/quill-ui-v2"
import { useTranslations } from "@/lib/i18n/use-translations"
import { cn } from "@/lib/utils"

interface AdConditionChipSelectorProps {
  value: number | null
  onValueChange: (value: number | null) => void
  options: readonly number[]
  labelFor: (option: number) => string
  testIdPrefix?: string
  className?: string
}

export default function AdConditionChipSelector({
  value,
  onValueChange,
  options,
  labelFor,
  testIdPrefix,
  className,
}: AdConditionChipSelectorProps) {
  const { t } = useTranslations()

  const chips: Array<{ key: string; value: number | null; label: string }> = [
    { key: "any", value: null, label: t("adForm.conditionAny") },
    ...options.map((option) => ({
      key: String(option),
      value: option,
      label: labelFor(option),
    })),
  ]

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {chips.map((chip) => {
        const isSelected = chip.value === value
        return (
          <Chip
            key={chip.key}
            label={chip.label}
            state={isSelected ? "selected" : "default"}
            onClick={() => onValueChange(chip.value)}
            className="flex-1"
            data-testid={testIdPrefix ? `${testIdPrefix}-${chip.key}` : undefined}
          />
        )
      })}
    </div>
  )
}
