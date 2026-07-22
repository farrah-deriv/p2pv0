"use client"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RTL_TABS_LIST } from "@/lib/rtl"
import { cn } from "@/lib/utils"

export type HeaderSegmentItem = {
  value: string
  label: string
  testId?: string
}

export type HeaderSegmentedControlWidth = 168 | 184

export interface HeaderSegmentedControlProps {
  value: string
  onValueChange: (value: string) => void
  segments: HeaderSegmentItem[]
  /** Minimum pill width — control grows to fit longer segment labels (i18n). */
  width?: HeaderSegmentedControlWidth
  className?: string
  listClassName?: string
  listDataGuideId?: string
}

const MIN_WIDTH_CLASS: Record<HeaderSegmentedControlWidth, string> = {
  168: "min-w-[168px]",
  184: "min-w-[184px]",
}

const TRACK_PADDING = "0.25rem"

const triggerClassName =
  "relative z-[1] flex-1 h-8 min-w-0 rounded-full border-0 bg-transparent px-3 py-0 text-sm font-normal text-white/60 shadow-none transition-colors whitespace-nowrap text-center " +
  "data-[state=active]:bg-transparent data-[state=active]:font-bold data-[state=active]:text-white " +
  "data-[state=active]:shadow-none focus-visible:ring-white/30"

/**
 * Compact pill segmented control for dark P2P headers (Markets, Orders, My Ads).
 * Mirrors mobile `HeaderSegmentedControl` styling and sliding selection indicator.
 */
export function HeaderSegmentedControl({
  value,
  onValueChange,
  segments,
  width = 168,
  className,
  listClassName,
  listDataGuideId,
}: HeaderSegmentedControlProps) {
  const segmentCount = segments.length
  const selectedIndex = Math.max(
    0,
    segments.findIndex((segment) => segment.value === value),
  )
  const segmentSpan = `((100% - ${TRACK_PADDING} * 2) / ${segmentCount})`
  const indicatorInset = `calc(${TRACK_PADDING} + ${selectedIndex} * ${segmentSpan})`

  return (
    <Tabs value={value} onValueChange={onValueChange} className={cn("flex min-w-0 max-w-full justify-start", className)}>
      <TabsList
        data-guide-id={listDataGuideId}
        className={cn(
          "relative inline-flex h-10 w-max max-w-full shrink-0 rounded-full bg-[var(--component-segmentedControl-bg-single-body,rgba(255,255,255,0.04))] p-1 gap-0",
          MIN_WIDTH_CLASS[width],
          RTL_TABS_LIST,
          listClassName,
        )}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-1 rounded-full bg-[var(--component-segmentedControl-bg-single-selected,rgba(255,255,255,0.16))] transition-[inset-inline-start] duration-200 ease-out motion-reduce:transition-none"
          style={{
            width: `calc(${segmentSpan})`,
            insetInlineStart: indicatorInset,
          }}
        />
        {segments.map((segment) => (
          <TabsTrigger
            key={segment.value}
            value={segment.value}
            data-testid={segment.testId}
            className={triggerClassName}
            title={segment.label}
          >
            <span className="block truncate">{segment.label}</span>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}
