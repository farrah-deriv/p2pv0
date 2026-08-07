"use client"

import * as React from "react"
import { StandaloneChevronLeftRegularIcon, StandaloneChevronRightRegularIcon } from "@deriv/quill-icons/Standalone"
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
} from "date-fns"
import { Button } from "@/components/ui/button"
import { formatAppMonthYear, getMondayFirstWeekdayLabels } from "@/lib/format-date"
import { useTranslations } from "@/lib/i18n/use-translations"
import { RTL_MIRROR_ICON } from "@/lib/rtl"
import { cn } from "@/lib/utils"
import type { DateRange } from "@/stores/orders-filter-store"

interface DualMonthCalendarProps {
  selected: DateRange
  onSelect: (range: DateRange) => void
  handleCustomRangeApply: (fromDate?: Date, toDate?: Date) => void
}

export function DualMonthCalendar({ selected, onSelect, handleCustomRangeApply }: DualMonthCalendarProps) {
  const { locale } = useTranslations()
  const [currentMonth, setCurrentMonth] = React.useState(new Date())
  const nextMonth = addMonths(currentMonth, 1)
  const weekdayLabels = React.useMemo(() => getMondayFirstWeekdayLabels(locale), [locale])

  const isFutureDate = (date: Date) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const checkDate = new Date(date)
    checkDate.setHours(0, 0, 0, 0)
    return checkDate > today
  }

  const handleDateClick = (date: Date) => {
    if (isFutureDate(date)) return

    if (!selected.from || (selected.from && selected.to)) {
      onSelect({ from: date, to: undefined })
    } else if (selected.from && !selected.to) {
      if (date < selected.from) {
        onSelect({ from: date, to: selected.from })
        handleCustomRangeApply(date, selected.from)
      } else {
        onSelect({ from: selected.from, to: date })
        handleCustomRangeApply(selected.from, date)
      }
    }
  }

  const isDateSelected = (date: Date) => {
    if (!selected.from) return false
    if (selected.to) {
      return date >= selected.from && date <= selected.to
    }
    return isSameDay(date, selected.from)
  }

  const isDateInRange = (date: Date) => {
    if (!selected.from || !selected.to) return false
    return date > selected.from && date < selected.to
  }

  const isToday = (date: Date) => {
    return isSameDay(date, new Date())
  }

  const renderMonth = (month: Date, isPrevVisible, isNextVisible) => {
    const monthStart = startOfMonth(month)
    const monthEnd = endOfMonth(month)
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

    const firstDayOfWeek = monthStart.getDay()
    const paddingDays = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1

    return (
      <div className="flex-1">
        <div className="flex rtl:flex-row-reverse">
          {isPrevVisible && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="p-2"
            >
              <StandaloneChevronLeftRegularIcon iconSize="xs" className={cn(RTL_MIRROR_ICON)} />
            </Button>
          )}
          <div className="text-center text-grayscale-600 mb-4 m-auto">{formatAppMonthYear(month, locale)}</div>
          {isNextVisible && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="p-2"
            >
              <StandaloneChevronRightRegularIcon iconSize="xs" className={cn(RTL_MIRROR_ICON)} />
            </Button>
          )}
        </div>
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekdayLabels.map((day, index) => (
            <div key={index} className="text-center text-sm text-gray-400 font-normal py-2">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: paddingDays }).map((_, index) => (
            <div key={`padding-${index}`} className="h-10" />
          ))}
          {days.map((date) => {
            const isSelected = isDateSelected(date)
            const inRange = isDateInRange(date)
            const today = isToday(date)
            const isFuture = isFutureDate(date)

            return (
              <Button
                key={date.toISOString()}
                variant="ghost"
                size="sm"
                onClick={() => handleDateClick(date)}
                disabled={isFuture}
                className={cn(
                  "font-normal rounded-md hover:bg-gray-100 transition-colors text-grayscale-600 relative",
                  isSelected && "bg-black text-white hover:bg-black hover:text-white",
                  inRange && "bg-gray-100 hover:text-white text-grayscale-600",
                  !isSameMonth(date, month) && "text-gray-300",
                  isFuture && "opacity-50 cursor-not-allowed hover:bg-transparent",
                )}
              >
                <span className="flex flex-col items-center gap-0.5">
                  {format(date, "d")}
                  {today && <span className={cn("w-1 h-1 rounded-full", isSelected ? "bg-white" : "bg-black")} />}
                </span>
              </Button>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex gap-8 rtl:flex-row-reverse">
        {renderMonth(currentMonth, true, false)}
        {renderMonth(nextMonth, false, true)}
      </div>
    </div>
  )
}
