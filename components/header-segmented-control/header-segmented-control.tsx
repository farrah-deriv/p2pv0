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
  /** Fixed width keeps the control a compact pill — matches mobile header tabs. */
  width?: HeaderSegmentedControlWidth
  className?: string
  listClassName?: string
  listDataGuideId?: string
}

const WIDTH_CLASS: Record<HeaderSegmentedControlWidth, string> = {
  168: "w-[168px]",
  184: "w-[184px]",
}

const TRACK_PADDING = "0.25rem"

const triggerClassName =
  "relative z-[1] flex-1 h-8 min-w-0 rounded-full border-0 bg-transparent px-2 py-0 text-sm font-normal text-white/60 shadow-none transition-colors " +
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
    <Tabs value={value} onValueChange={onValueChange} className={cn("flex justify-start", className)}>
      <TabsList
        data-guide-id={listDataGuideId}
        className={cn(
          "relative inline-flex h-10 shrink-0 rounded-full bg-white/10 p-1 gap-0",
          WIDTH_CLASS[width],
          RTL_TABS_LIST,
          listClassName,
        )}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-1 rounded-full bg-white/20 transition-[inset-inline-start] duration-200 ease-out motion-reduce:transition-none"
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
          >
            {segment.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}
