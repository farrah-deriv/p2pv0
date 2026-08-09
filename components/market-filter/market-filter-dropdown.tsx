"use client"

import type React from "react"

import { useCallback, useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer"
import { useIsMobile } from "@/hooks/use-mobile"
import type { MarketFilterOptions } from "./types"
import { useTranslations } from "@/lib/i18n/use-translations"
import { cn } from "@/lib/utils"
import { CHECKBOX_LABEL_ROW } from "@/lib/rtl"
import { useUserDataStore } from "@/stores/user-data-store"
import { useTrackers } from "@/analytics/useTrackers"

interface MarketFilterDropdownProps {
  activeTab?: string
  onApply: (filters: MarketFilterOptions, sortByValue?: string) => void
  initialFilters: MarketFilterOptions
  initialSortBy: string
  trigger: React.ReactElement
  hasActiveFilters?: boolean
  onOpenChange?: (open: boolean) => void
  disabled?: boolean
}

export default function MarketFilterDropdown({
  activeTab,
  onApply,
  initialFilters,
  initialSortBy,
  trigger,
  hasActiveFilters = false,
  onOpenChange: onOpenChangeProp,
  disabled = false,
}: MarketFilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [filters, setFilters] = useState<MarketFilterOptions>(initialFilters)
  const [sortBy, setSortBy] = useState(initialSortBy)
  const isMobile = useIsMobile()
  const { t } = useTranslations()
  const { userData } = useUserDataStore()
  const { track } = useTrackers()

  useEffect(() => {
    setFilters(initialFilters)
  }, [initialFilters])

  const handleReset = () => {
    track("ek_reset_filters_markets_filter")
    setSortBy("trade_band_rank")
    onApply({ fromFollowing: false }, "trade_band_rank")
    setIsOpen(false)
    onOpenChangeProp?.(false)
  }

  const handleApply = () => {
    track("ek_apply_filters_markets_filter")
    onApply(filters, sortBy)
    setIsOpen(false)
    onOpenChangeProp?.(false)
  }

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (disabled) return
      setIsOpen(open)
      onOpenChangeProp?.(open)
    },
    [disabled, onOpenChangeProp],
  )

  const handleFilterChange = (key: keyof MarketFilterOptions, value: boolean) => {
    if (key === "fromFollowing") track("ek_toggle_followed_users_markets_filter")
    const newFilters = {
      ...filters,
      [key]: value,
    }
    setFilters(newFilters)

    if (!isMobile) {
      onApply(newFilters, sortBy)
    }
  }

  const handleSortByChange = (value: "exchange_rate" | "user_rating_average_lifetime" | "trade_band_rank") => {
    if (value === "trade_band_rank") track("ek_sort_by_tier_level_markets_filter")
    else if (value === "exchange_rate") track("ek_sort_by_exchange_rate_markets_filter")
    else if (value === "user_rating_average_lifetime") track("ek_sort_by_user_rating_markets_filter")
    setSortBy(value)

    if (!isMobile) {
      onApply(filters, value)
    }
  }

  const FilterContent = () => (
    <div className="w-full">
      <div className="space-y-3 pb-4">
        <h4 className="text-grayscale-text-muted text-sm">{t("filter.adTypes")}</h4>
        <div className={cn(CHECKBOX_LABEL_ROW, "items-start")}>
          <Checkbox
            id="from-following"
            checked={filters.fromFollowing}
            onCheckedChange={(checked) => handleFilterChange("fromFollowing", checked as boolean)}
            className="mt-0.5 shrink-0 data-[state=checked]:bg-black"
            data-testid="market-filter-checkbox-following"
          />
          <label
            htmlFor="from-following"
            className="flex-1 min-w-0 cursor-pointer text-start text-sm text-grayscale-600 break-words"
          >
            {t("filter.adsFromFollowing")}
          </label>
        </div>
      </div>
      <div className="space-y-3 border-t pt-4">
        <h4 className="text-grayscale-text-muted text-sm">{t("filter.sortBy")}</h4>
        <RadioGroup value={sortBy} onValueChange={handleSortByChange} className="flex flex-col gap-3">
          <div className={cn(CHECKBOX_LABEL_ROW, "items-start")}>
            <RadioGroupItem value="trade_band_rank" id="trade_band_rank" className="mt-0.5 shrink-0 border-grayscale-100 text-black" data-testid="market-filter-radio-sort-tier" />
            <label htmlFor="trade_band_rank" className="flex-1 min-w-0 cursor-pointer text-start text-sm text-grayscale-600 break-words">
              {t("filter.tierLevelHighLow")}
            </label>
          </div>
          <div className={cn(CHECKBOX_LABEL_ROW, "items-start")}>
            <RadioGroupItem value="exchange_rate" id="exchange_rate" className="mt-0.5 shrink-0 border-grayscale-100 text-black" data-testid="market-filter-radio-sort-rate" />
            <label htmlFor="exchange_rate" className="flex-1 min-w-0 cursor-pointer text-start text-sm text-grayscale-600 break-words">
              {activeTab === "sell" ? t("filter.exchangeRateLowHigh") : t("filter.exchangeRateHighLow")}
            </label>
          </div>
          <div className={cn(CHECKBOX_LABEL_ROW, "items-start")}>
            <RadioGroupItem
              value="user_rating_average_lifetime"
              id="user_rating_average_lifetime"
              className="mt-0.5 shrink-0 border-grayscale-100 text-black"
              data-testid="market-filter-radio-sort-rating"
            />
            <label
              htmlFor="user_rating_average_lifetime"
              className="flex-1 min-w-0 cursor-pointer text-start text-sm text-grayscale-600 break-words"
            >
              {t("filter.userRatingHighLow")}
            </label>
          </div>
        </RadioGroup>
      </div>
      {isMobile && (
        <div className="flex md:flex-row flex-col-reverse gap-3 mt-4">
          <Button variant="secondary-outline" onClick={handleReset} className="md:flex-1" data-testid="market-filter-btn-reset">
            {t("filter.reset")}
          </Button>
          <Button onClick={handleApply} className="md:flex-1" data-testid="market-filter-btn-apply">
            {t("filter.apply")}
          </Button>
        </div>
      )}
    </div>
  )

  const disabledTrigger = (
    <div
      className={cn("relative w-fit", disabled && "pointer-events-none opacity-60 cursor-not-allowed")}
      aria-disabled={disabled || undefined}
      data-testid="market-filter-btn-trigger"
    >
      {trigger}
      {hasActiveFilters && (
        <div className="absolute top-[5px] right-[12px] w-2 h-2 bg-red-500 rounded-full"></div>
      )}
    </div>
  )

  if (disabled) {
    return disabledTrigger
  }

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={handleOpenChange}>
        <DrawerTrigger asChild>
          <div className="relative" data-testid="market-filter-btn-trigger">
            {trigger}
            {hasActiveFilters && (
              <div className="absolute top-[5px] right-[12px] w-2 h-2 bg-red-500 rounded-full"></div>
            )}
          </div>
        </DrawerTrigger>
        <DrawerContent side="bottom" className="h-fit p-4 rounded-t-2xl">
          <div className="my-4">
            <h3 className="text-xl font-bold text-center">{t("filter.filter")}</h3>
          </div>
          <FilterContent />
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <div className="relative w-fit" data-testid="market-filter-btn-trigger">
          {trigger}
          {hasActiveFilters && <div className="absolute top-[5px] right-[12px] w-2 h-2 bg-red-500 rounded-full"></div>}
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4" align="end">
        <FilterContent />
      </PopoverContent>
    </Popover>
  )
}
