"use client"

import { useCallback, useState, useMemo, useRef, useEffect, useLayoutEffect } from "react"
import { createPortal } from "react-dom"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Drawer, DrawerContent } from "@/components/ui/drawer"
import { useIsMobile } from "@/hooks/use-mobile"
import EmptyState from "@/components/empty-state"
import { cn } from "@/lib/utils"
import { CHECKBOX_LABEL_ROW } from "@/lib/rtl"
import { useTranslations } from "@/lib/i18n/use-translations"
import { useTrackers } from "@/analytics/useTrackers"
import {
  StandaloneChevronDownRegularIcon,
  StandaloneChevronUpRegularIcon,
  StandaloneSearchRegularIcon,
} from "@deriv/quill-icons/Standalone"

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
  onOpenChange?: (isOpen: boolean) => void
  disabled?: boolean
  triggerLabel: string
  triggerClassName?: string
  triggerDataGuideId?: string
  onOpen?: () => void
}

export default function PaymentMethodsFilter({
  paymentMethods,
  selectedMethods,
  onSelectionChange,
  isLoading = false,
  onOpenChange: onOpenChangeProp,
  disabled = false,
  triggerLabel,
  triggerClassName,
  triggerDataGuideId,
  onOpen,
}: PaymentMethodsFilterProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [tempSelectedMethods, setTempSelectedMethods] = useState<string[]>(selectedMethods)
  const isMobile = useIsMobile()
  const { t } = useTranslations()
  const { track } = useTrackers()
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const scrollPositionRef = useRef<number | null>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties | null>(null)

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
        if (!acc[type]) acc[type] = []
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
      setTempSelectedMethods([...new Set([...tempSelectedMethods, ...paymentMethods.map((m) => m.method)])])
    } else {
      const allMethodIds = paymentMethods.map((m) => m.method)
      setTempSelectedMethods(tempSelectedMethods.filter((id) => !allMethodIds.includes(id)))
    }
  }

  const handleMethodToggle = (methodId: string) => {
    track("ek_select_payment_method_markets_payment_method_filter", { payment_method_name: methodId })
    if (scrollContainerRef.current) {
      scrollPositionRef.current = scrollContainerRef.current.scrollTop
    }
    if (isAllSelected) {
      setTempSelectedMethods(paymentMethods.map((m) => m.method).filter((m) => m !== methodId))
      return
    }
    const isSelected = tempSelectedMethods.includes(methodId)
    setTempSelectedMethods(
      isSelected
        ? tempSelectedMethods.filter((id) => id !== methodId)
        : [...tempSelectedMethods, methodId],
    )
  }

  const closeDropdown = useCallback(() => {
    setIsOpen(false)
    onOpenChangeProp?.(false)
    setSearchQuery("")
  }, [onOpenChangeProp])

  const openDropdown = useCallback(() => {
    if (disabled) return
    setIsOpen(true)
    onOpenChangeProp?.(true)
    setTempSelectedMethods(selectedMethods)
    onOpen?.()
  }, [disabled, onOpenChangeProp, selectedMethods, onOpen])

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (open) openDropdown()
      else closeDropdown()
    },
    [openDropdown, closeDropdown],
  )

  const handleReset = () => {
    track("ek_reset_filter_markets_payment_method_filter")
    const allMethodIds = paymentMethods.map((method) => method.method)
    setTempSelectedMethods(allMethodIds)
    onSelectionChange(allMethodIds)
    closeDropdown()
  }

  const handleApply = () => {
    track("ek_apply_filter_markets_payment_method_filter")
    onSelectionChange(tempSelectedMethods)
    closeDropdown()
  }

  const getGroupTitle = (type: string) => {
    if (type === "bank") return t("paymentMethod.bankTransfers")
    if (type === "ewallet") return t("paymentMethod.eWallets")
    return type?.charAt(0).toUpperCase() + type?.slice(1)
  }

  // Close on outside click (desktop only)
  useEffect(() => {
    if (!isOpen || isMobile) return
    const onMouseDown = (e: MouseEvent) => {
      const target = e.target as Node
      if (!triggerRef.current?.contains(target) && !dropdownRef.current?.contains(target)) {
        closeDropdown()
      }
    }
    document.addEventListener("mousedown", onMouseDown)
    return () => document.removeEventListener("mousedown", onMouseDown)
  }, [isOpen, isMobile, closeDropdown])

  // Position portal dropdown (right-aligned with trigger)
  useLayoutEffect(() => {
    if (!isOpen || isMobile || !triggerRef.current) {
      setDropdownStyle(null)
      return
    }
    const rect = triggerRef.current.getBoundingClientRect()
    const dropdownH = 400
    const spaceBelow = window.innerHeight - rect.bottom
    const openUpward = spaceBelow < dropdownH && rect.top > dropdownH
    setDropdownStyle(
      openUpward
        ? { bottom: window.innerHeight - rect.top + 4, right: window.innerWidth - rect.right, width: 320 }
        : { top: rect.bottom + 4, right: window.innerWidth - rect.right, width: 320 },
    )
  }, [isOpen, isMobile])

  // Focus search on desktop open
  useEffect(() => {
    if (!isOpen || isMobile) return
    const id = requestAnimationFrame(() => searchRef.current?.focus())
    return () => cancelAnimationFrame(id)
  }, [isOpen, isMobile])

  // Restore scroll position after checkbox toggle
  useEffect(() => {
    if (!scrollContainerRef.current || scrollPositionRef.current === null) return
    scrollContainerRef.current.scrollTop = scrollPositionRef.current
    scrollPositionRef.current = null
  }, [tempSelectedMethods])

  const renderPaymentMethodGroups = () => {
    if (Object.keys(groupedMethods).length === 0) return null
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
                  checked={isAllSelected || tempSelectedMethods.includes(method.method)}
                  onCheckedChange={() => handleMethodToggle(method.method)}
                  className="shrink-0 data-[state=checked]:bg-black"
                  disabled={isLoading}
                  data-testid={`payment-filter-checkbox-${method.display_name}`}
                />
                <label
                  htmlFor={method.method}
                  className="flex-1 min-w-0 cursor-pointer text-start text-sm text-grayscale-600"
                >
                  {method.display_name}
                </label>
              </div>
            ))}
          </div>
        </div>
      ))
  }

  const filterContent = (
    <div className="flex h-full w-full flex-col">
      <div className="relative mb-4 shrink-0">
        <div className="flex items-center gap-2 rounded-lg bg-black/[0.04] px-2 h-9">
          <StandaloneSearchRegularIcon iconSize="xs" className="shrink-0 text-neutral-400" aria-hidden />
          <input
            ref={searchRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("paymentMethod.search")}
            className="min-w-0 flex-1 border-0 bg-transparent text-sm outline-none placeholder:text-neutral-400"
            autoComplete="off"
            data-testid="payment-filter-input-search"
          />
        </div>
      </div>

      <div
        ref={scrollContainerRef}
        className={cn(
          "min-h-0 flex-1 space-y-2 overflow-y-auto scrollbar-custom md:h-60 md:flex-none",
          filteredPaymentMethods.length === 0 && "flex items-center justify-center",
        )}
      >
        {filteredPaymentMethods.length > 0 && (
          <div className={cn(CHECKBOX_LABEL_ROW, "mb-4")}>
            <Checkbox
              id="select-all"
              checked={isAllSelected ? true : isIndeterminate ? "indeterminate" : false}
              onCheckedChange={handleSelectAll}
              className="shrink-0 data-[state=checked]:bg-black"
              disabled={isLoading || filteredPaymentMethods.length === 0}
              data-testid="payment-filter-checkbox-select-all"
            />
            <label
              htmlFor="select-all"
              className="flex-1 min-w-0 cursor-pointer text-start text-sm text-slate-1200"
            >
              {t("paymentMethod.allPaymentMethod")}
            </label>
          </div>
        )}
        {isLoading ? (
          <div className="text-center py-4 text-grayscale-text-muted">{t("paymentMethod.loadingPaymentMethods")}</div>
        ) : filteredPaymentMethods.length === 0 ? (
          <div className="w-full">
            {searchQuery ? (
              <EmptyState
                title={t("paymentMethod.paymentMethodUnavailable")}
                description={t("paymentMethod.searchDifferent")}
                redirectToAds={false}
              />
            ) : (
              <p className="text-center text-grayscale-text-muted">{t("paymentMethod.noPaymentMethodsAvailable")}</p>
            )}
          </div>
        ) : (
          renderPaymentMethodGroups()
        )}
      </div>

      {filteredPaymentMethods.length > 0 && (
        <div className="mt-4 flex shrink-0 flex-col-reverse gap-3 md:flex-row">
          <Button
            onClick={handleReset}
            className="flex-1 bg-transparent"
            variant="secondary"
            size={isMobile ? "default" : "sm"}
            data-testid="payment-filter-btn-reset"
          >
            {t("paymentMethod.reset")}
          </Button>
          <Button
            onClick={handleApply}
            className="flex-1"
            size={isMobile ? "default" : "sm"}
            data-testid="payment-filter-btn-apply"
          >
            {t("paymentMethod.apply")}
          </Button>
        </div>
      )}
    </div>
  )

  const triggerButton = (
    <Button
      ref={triggerRef}
      variant="outline"
      data-testid="payment-filter-btn-trigger"
      data-guide-id={triggerDataGuideId}
      disabled={disabled}
      onClick={() => (isOpen ? closeDropdown() : openDropdown())}
      aria-expanded={isOpen}
      aria-haspopup="listbox"
      className={cn(
        "!h-12 !w-full !rounded-lg !border !border-solid !border-neutral-200 !bg-white !px-3 !text-sm !font-normal focus:!ring-1 focus:!ring-black",
        triggerClassName,
      )}
    >
      <span className="flex w-full flex-row items-center justify-between">
        <span className="min-w-0 flex-1 truncate overflow-hidden text-ellipsis whitespace-nowrap">{triggerLabel}</span>
        {isOpen && !isMobile ? (
          <StandaloneChevronUpRegularIcon iconSize="xs" className="ms-1.5 shrink-0" />
        ) : (
          <StandaloneChevronDownRegularIcon iconSize="xs" className="ms-1.5 shrink-0" />
        )}
      </span>
    </Button>
  )

  if (isMobile) {
    return (
      <>
        {triggerButton}
        <Drawer open={isOpen} onOpenChange={handleOpenChange}>
          <DrawerContent
            side="bottom"
            className="flex h-[85vh] max-h-[85vh] flex-col overflow-hidden rounded-t-2xl"
          >
            <div className="my-4 shrink-0">
              <h3 className="text-center text-xl font-bold">{t("paymentMethod.title")}</h3>
            </div>
            <div className="min-h-0 flex-1 overflow-hidden px-4 pb-4">{filterContent}</div>
          </DrawerContent>
        </Drawer>
      </>
    )
  }

  return (
    <>
      {triggerButton}
      {isOpen &&
        dropdownStyle &&
        typeof document !== "undefined" &&
        createPortal(
          <div ref={dropdownRef} className="fixed z-50" style={dropdownStyle}>
            <div className="flex h-96 flex-col overflow-hidden rounded-lg border border-neutral-200 bg-white p-4 shadow-lg">
              {filterContent}
            </div>
          </div>,
          document.body,
        )}
    </>
  )
}
