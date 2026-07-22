"use client"

import type React from "react"

import type { ReactElement } from "react"
import { useCallback, useState, useMemo, cloneElement, useRef, useEffect } from "react"
import Image from "next/image"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { useIsMobile } from "@/hooks/use-mobile"
import EmptyState from "@/components/empty-state"
import { cn } from "@/lib/utils"
import { CHECKBOX_LABEL_ROW } from "@/lib/rtl"
import { useTranslations } from "@/lib/i18n/use-translations"
import { useTrackers } from "@/analytics/useTrackers"

export interface PaymentMethod {
  display_name: string
  type: string
  method: string
}

interface PaymentMethodsFilterProps {
  paymentMethods: PaymentMethod[]
  selectedMethods: string[]
  onSelectionChange: (selectedMethods: string[]) => void
  isLoading?: boolean
  trigger: ReactElement
  onOpenChange?: (isOpen: boolean) => void
  disabled?: boolean
}

export default function PaymentMethodsFilter({
  paymentMethods,
  selectedMethods,
  onSelectionChange,
  isLoading = false,
  trigger,
  onOpenChange: onOpenChangeProp,
  disabled = false,
}: PaymentMethodsFilterProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [tempSelectedMethods, setTempSelectedMethods] = useState<string[]>(selectedMethods)
  const isMobile = useIsMobile()
  const { t } = useTranslations()
  const { track } = useTrackers()
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const scrollPositionRef = useRef<number | null>(null)

  const filteredPaymentMethods = useMemo(() => {
    if (!searchQuery.trim()) return paymentMethods

    return paymentMethods.filter(
      (method) =>
        method.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        method.method.toLowerCase().includes(searchQuery.toLowerCase()),
    )
  }, [paymentMethods, searchQuery])

  const groupedMethods = useMemo(() => {
    return filteredPaymentMethods.reduce(
      (acc, method) => {
        const { type } = method
        if (!acc[type]) {
          acc[type] = []
        }
        acc[type].push(method)
        return acc
      },
      {} as Record<string, PaymentMethod[]>,
    )
  }, [filteredPaymentMethods])

  const isAllSelected =
    paymentMethods.length > 0 &&
    paymentMethods.every((method) => tempSelectedMethods.includes(method.method))

  const isIndeterminate =
    paymentMethods.some((method) => tempSelectedMethods.includes(method.method)) && !isAllSelected

  const handleSelectAll = (checked: boolean) => {
    if (scrollContainerRef.current) {
      scrollPositionRef.current = scrollContainerRef.current.scrollTop
    }

    if (checked) {
      track("ek_select_all_payment_methods_markets_payment_method_filter")
      const newSelection = [...new Set([...tempSelectedMethods, ...paymentMethods.map((m) => m.method)])]
      setTempSelectedMethods(newSelection)
    } else {
      const allMethodIds = paymentMethods.map((method) => method.method)
      const newSelection = tempSelectedMethods.filter((id) => !allMethodIds.includes(id))
      setTempSelectedMethods(newSelection)
    }
  }

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchQuery(value)
  }, [])

  const handleMethodToggle = (methodId: string) => {
    track("ek_select_payment_method_markets_payment_method_filter", { payment_method_name: methodId })
    if (scrollContainerRef.current) {
      scrollPositionRef.current = scrollContainerRef.current.scrollTop
    }

    if (isAllSelected) {
      setTempSelectedMethods([methodId])
      return
    }
    const isSelected = tempSelectedMethods.includes(methodId)
    if (isSelected) {
      setTempSelectedMethods(tempSelectedMethods.filter((id) => id !== methodId))
    } else {
      setTempSelectedMethods([...tempSelectedMethods, methodId])
    }
  }

  const handleOpenChange = (open: boolean) => {
    if (disabled) return
    setIsOpen(open)
    onOpenChangeProp?.(open)
    if (!open) {
      setSearchQuery("")
    } else {
      setTempSelectedMethods(selectedMethods)
    }
  }

  const handleReset = () => {
    track("ek_reset_filter_markets_payment_method_filter")
    const allMethodIds = paymentMethods.map((method) => method.method)
    setTempSelectedMethods(allMethodIds)
    onSelectionChange(allMethodIds)
    setIsOpen(false)
    onOpenChangeProp?.(false)
    setSearchQuery("")
  }

  const handleApply = () => {
    track("ek_apply_filter_markets_payment_method_filter")
    onSelectionChange(tempSelectedMethods)
    setIsOpen(false)
    onOpenChangeProp?.(false)
    setSearchQuery("")
  }

  const getGroupTitle = (type: string) => {
    if (type === "bank") return t("paymentMethod.bankTransfers")
    if (type === "ewallet") return t("paymentMethod.eWallets")
    return type?.charAt(0).toUpperCase() + type?.slice(1)
  }

  const renderPaymentMethodGroups = () => {
    if (Object.keys(groupedMethods).length === 0) {
      return null
    }

    return Object.entries(groupedMethods)
      .sort(([typeA], [typeB]) => typeA.localeCompare(typeB))
      .map(([type, methods], index, entries) => (
        <div
          key={type}
          className={cn(
            "space-y-3",
            index > 0 && "border-t pt-4",
            index < entries.length - 1 && "pb-4",
          )}
        >
          <h4 className="text-grayscale-text-muted text-sm">{getGroupTitle(type)}</h4>
          <div className="flex flex-col gap-3">
            {methods.map((method) => (
              <div key={method.method} className={CHECKBOX_LABEL_ROW}>
                <Checkbox
                  id={method.method}
                  checked={isAllSelected ? false : tempSelectedMethods.includes(method.method)}
                  onCheckedChange={() => handleMethodToggle(method.method)}
                  className="shrink-0 data-[state=checked]:bg-black"
                  disabled={isLoading}
                  data-testid={`payment-filter-checkbox-${method.id ?? method.display_name}`}
                />
                <label htmlFor={method.method} className="flex-1 min-w-0 cursor-pointer text-start text-sm text-grayscale-600">
                  {method.display_name}
                </label>
              </div>
            ))}
          </div>
        </div>
      ))
  }

  const filterContent = (
    <div className="w-full">
      <div className="relative mb-4">
        <Image
          src="/icons/search-icon-custom.png"
          alt={t("common.search")}
          width={24}
          height={24}
          className="absolute start-3 top-1/2 transform -translate-y-1/2"
        />
        <Input
          placeholder={t("paymentMethod.search")}
          value={searchQuery}
          onChange={handleSearchChange}
          className="h-14 rounded-lg border-0 bg-grayscale-500 text-sm font-normal text-start placeholder:text-grayscale-text-placeholder ps-10 pe-10 focus:border-0 md:h-8"
          autoComplete="off"
          data-testid="payment-filter-input-search"
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSearchQuery("")}
            className="absolute end-0 top-1/2 transform -translate-y-1/2 hover:bg-transparent"
            data-testid="payment-filter-btn-clear"
          >
            <Image src="/icons/clear-search-icon.png" alt={t("common.clearSearch")} width={24} height={24} />
          </Button>
        )}
      </div>

      <div
        ref={scrollContainerRef}
        className={cn(
          "space-y-2 overflow-y-auto scrollbar-custom",
          filteredPaymentMethods.length === 0
            ? "flex items-center justify-center min-h-[200px] md:max-h-60"
            : "max-h-60",
        )}
      >
        {filteredPaymentMethods.length > 0 && (
          <div className={cn(CHECKBOX_LABEL_ROW, "mb-4")}>
            <Checkbox
              id="select-all"
              checked={isAllSelected}
              ref={(el) => {
                if (el) el.indeterminate = isIndeterminate
              }}
              onCheckedChange={handleSelectAll}
              className="shrink-0 data-[state=checked]:bg-black"
              disabled={isLoading || filteredPaymentMethods.length === 0}
              data-testid="payment-filter-checkbox-select-all"
            />
            <label htmlFor="select-all" className="flex-1 min-w-0 cursor-pointer text-start text-sm text-slate-1200">
              {t("paymentMethod.allPaymentMethod")}
            </label>
          </div>
        )}
        {isLoading ? (
          <div className="text-center py-4 text-gray-500">{t("paymentMethod.loadingPaymentMethods")}</div>
        ) : filteredPaymentMethods.length === 0 ? (
          <div className="w-full">
            {searchQuery ? (
              <EmptyState
                title={t("paymentMethod.paymentMethodUnavailable")}
                description={t("paymentMethod.searchDifferent")}
                redirectToAds={false}
              />
            ) : (
              <p className="text-center text-gray-500">{t("paymentMethod.noPaymentMethodsAvailable")}</p>
            )}
          </div>
        ) : (
          renderPaymentMethodGroups()
        )}
      </div>

      {filteredPaymentMethods.length > 0 && (
        <div className="flex flex-col-reverse md:flex-row gap-3 mt-4">
          <Button
            onClick={handleReset}
            className="flex-1 bg-transparent"
            variant="outline"
            size={isMobile ? "default" : "sm"}
            data-testid="payment-filter-btn-reset"
          >
            {t("paymentMethod.reset")}
          </Button>
          <Button onClick={handleApply} className="flex-1" size={isMobile ? "default" : "sm"} data-testid="payment-filter-btn-apply">
            {t("paymentMethod.apply")}
          </Button>
        </div>
      )}
    </div>
  )

  useEffect(() => {
    if (!scrollContainerRef.current) return
    if (scrollPositionRef.current === null) return

    scrollContainerRef.current.scrollTop = scrollPositionRef.current
    scrollPositionRef.current = null
  }, [tempSelectedMethods])

  const enhancedTrigger = cloneElement(trigger, {
    className: cn(
      trigger.props.className,
      isOpen && !disabled && "[&_img[alt='Arrow']]:rotate-180",
      disabled && "pointer-events-none opacity-60 cursor-not-allowed",
    ),
    disabled: disabled || trigger.props.disabled,
    "aria-disabled": disabled || undefined,
    "data-testid": "payment-filter-btn-trigger",
  })

  if (disabled) {
    return enhancedTrigger
  }

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={handleOpenChange}>
        <DrawerTrigger asChild>{enhancedTrigger}</DrawerTrigger>
        <DrawerContent side="bottom" className="h-fit p-4 rounded-t-2xl">
          <div className="my-4">
            <h3 className="text-xl font-bold text-center">{t("paymentMethod.title")}</h3>
          </div>
          {filterContent}
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>{enhancedTrigger}</PopoverTrigger>
      <PopoverContent className="w-80 p-4" align="end">
        {filterContent}
      </PopoverContent>
    </Popover>
  )
}
