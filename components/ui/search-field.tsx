"use client"

import * as React from "react"
import Image from "next/image"
import { StandaloneSearchRegularIcon } from "@deriv/quill-icons/Standalone"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useTranslations } from "@/lib/i18n/use-translations"

export interface SearchFieldProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  value: string
  onChange: (value: string) => void
  /** Optional clear handler. When provided, a clear button shows while value is non-empty. */
  onClear?: () => void
  /** Extra classes for the outer container. */
  containerClassName?: string
  /** Localized aria-label for the clear button. Defaults to common.clearSearch. */
  clearAriaLabel?: string
}

/**
 * Shared search field: magnifying-glass icon + text input + optional clear button.
 * Mirrors the search pattern used across the app (market sidebar, filters, follow list)
 * so search inputs stay visually and behaviourally consistent.
 */
export const SearchField = React.forwardRef<HTMLInputElement, SearchFieldProps>(
  (
    { value, onChange, onClear, containerClassName, clearAriaLabel, className, disabled, ...props },
    ref,
  ) => {
    const { t } = useTranslations()

    return (
      <div
        className={cn(
          "flex items-center gap-2 rounded-lg bg-black/[0.04] px-3 h-10",
          disabled && "opacity-50",
          containerClassName,
        )}
      >
        <StandaloneSearchRegularIcon iconSize="xs" className="shrink-0 text-neutral-400" aria-hidden />
        <input
          ref={ref}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          autoComplete="off"
          className={cn(
            "min-w-0 flex-1 border-0 bg-transparent text-sm outline-none placeholder:text-neutral-400 disabled:cursor-not-allowed disabled:opacity-50",
            className,
          )}
          {...props}
        />
        {onClear && value && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClear}
            className="hover:!bg-transparent !p-0 !h-auto !w-auto !min-w-0"
            aria-label={clearAriaLabel ?? t("common.clearSearch")}
          >
            <Image src="/icons/clear-search-icon.png" alt="" aria-hidden width={20} height={20} />
          </Button>
        )}
      </div>
    )
  },
)
SearchField.displayName = "SearchField"
