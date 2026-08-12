"use client"

import * as React from "react"
import { formatAppDate } from "@/lib/format-date"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer"
import type { DateFilterType, DateRange } from "@/stores/orders-filter-store"
import { useIsMobile } from "@/hooks/use-mobile"
import { SingleMonthCalendar } from "./single-month-calendar"
import { DualMonthCalendar } from "./dual-month-calendar"
import { cn } from "@/lib/utils"
import { useTranslations } from "@/lib/i18n/use-translations"
import {
  StandaloneCalendarRegularIcon,
  StandaloneChevronDownRegularIcon,
  StandaloneChevronUpRegularIcon,
} from "@deriv/quill-icons/Standalone"

interface DateFilterProps {
  customRange: DateRange
  onValueChange: (value: DateFilterType) => void
  onCustomRangeChange: (range: DateRange) => void
  className?: string
}

export function DateFilter({ customRange, onValueChange, onCustomRangeChange, className }: DateFilterProps) {
  const { t, locale } = useTranslations()
  const [isOpen, setIsOpen] = React.useState(false)
  const [tempRange, setTempRange] = React.useState<DateRange>(customRange)
  const isMobile = useIsMobile()

  const getDisplayLabel = () => {
    if (customRange.from) {
      const formatRangeDate = (date: Date) => formatAppDate(date, locale)
      if (customRange.to) {
        if (customRange.from.getTime() === customRange.to.getTime()) {
          return formatRangeDate(customRange.from)
        }
        return `${formatRangeDate(customRange.from)} - ${formatRangeDate(customRange.to)}`
      }
      return formatRangeDate(customRange.from)
    }
    return t("orders.allTime")
  }

  const handleCustomRangeApply = () => {
    const normalizedRange = {
      from: tempRange.from
        ? new Date(tempRange.from.getFullYear(), tempRange.from.getMonth(), tempRange.from.getDate())
        : undefined,
      to: tempRange.to
        ? new Date(tempRange.to.getFullYear(), tempRange.to.getMonth(), tempRange.to.getDate())
        : undefined,
    }
    onCustomRangeChange(normalizedRange)
    onValueChange("custom")
    setIsOpen(false)
  }

  const handleCustomRange = (fromDate?: Date, toDate?: Date) => {
    const normalizedRange = {
      from: fromDate ? new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate()) : undefined,
      to: toDate ? new Date(toDate.getFullYear(), toDate.getMonth(), toDate.getDate()) : undefined,
    }
    onCustomRangeChange(normalizedRange)
    onValueChange("custom")
    setIsOpen(false)
  }

  const handleReset = () => {
    const resetRange = { from: undefined, to: undefined }
    setTempRange(resetRange)
    onCustomRangeChange(resetRange)
    onValueChange("all")
    setIsOpen(false)
  }

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={setIsOpen}>
        <DrawerTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "!h-10 !min-h-10 !rounded-3xl !border !border-solid !border-neutral-200 !bg-transparent !font-normal !px-3 !text-sm hover:!bg-transparent focus:!outline-none",
              className,
            )}
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <StandaloneCalendarRegularIcon iconSize="xs" aria-hidden />
                <span>{getDisplayLabel()}</span>
              </div>
              <StandaloneChevronDownRegularIcon iconSize="xs" className="ms-2" aria-hidden />
            </div>
          </Button>
        </DrawerTrigger>
        <DrawerContent>
          <div className="bg-white p-4">
            <SingleMonthCalendar selected={tempRange} onSelect={setTempRange} />
            <div className="flex flex-col gap-2 mt-6">
              <Button onClick={handleCustomRangeApply} className="md:flex-1" disabled={!tempRange.from}>
                {t("orders.confirm")}
              </Button>
              <Button variant="secondary-outline" onClick={handleReset} className="md:flex-1">
                {t("orders.reset")}
              </Button>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "!h-10 !min-h-10 !rounded-3xl !border !border-solid !border-neutral-200 !bg-transparent !font-normal !px-3 !text-sm hover:!bg-transparent focus:!outline-none",
            className,
          )}
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <StandaloneCalendarRegularIcon iconSize="xs" aria-hidden />
              <span>{getDisplayLabel()}</span>
            </div>
            {isOpen ? (
              <StandaloneChevronUpRegularIcon iconSize="xs" className="ms-2" aria-hidden />
            ) : (
              <StandaloneChevronDownRegularIcon iconSize="xs" className="ms-2" aria-hidden />
            )}
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        <div className="relative">
          <DualMonthCalendar handleCustomRangeApply={handleCustomRange} selected={tempRange} onSelect={setTempRange} />
        </div>
      </PopoverContent>
    </Popover>
  )
}
