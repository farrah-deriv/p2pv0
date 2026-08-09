"use client"

import { useState, useMemo, useCallback, useRef, useLayoutEffect, useEffect } from "react"
import Image from "next/image"
import { createPortal } from "react-dom"
import { Button } from "@/components/ui/button"
import { Drawer, DrawerContent } from "@/components/ui/drawer"
import { useIsMobile } from "@/hooks/use-mobile"
import { cn, currencyFlagMapper } from "@/lib/utils"
import type { Currency } from "./types"
import EmptyState from "@/components/empty-state"
import { useTranslations } from "@/lib/i18n/use-translations"
import { useTrackers } from "@/analytics/useTrackers"
import {
  StandaloneChevronDownRegularIcon,
  StandaloneChevronUpRegularIcon,
  StandaloneSearchRegularIcon,
} from "@deriv/quill-icons/Standalone"

interface CurrencyFilterProps {
  currencies: Currency[]
  selectedCurrency: string
  onCurrencySelect: (currencyCode: string) => void
  title?: string
  placeholder?: string
  disabled?: boolean
  triggerClassName?: string
  triggerTestId?: string
  onOpen?: () => void
}

export function CurrencyFilter({
  currencies,
  selectedCurrency,
  onCurrencySelect,
  title,
  placeholder,
  disabled = false,
  triggerClassName,
  triggerTestId,
  onOpen,
}: CurrencyFilterProps) {
  const { t } = useTranslations()
  const { track } = useTrackers()
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const isMobile = useIsMobile()
  const triggerRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties | null>(null)

  const filteredCurrencies = useMemo(() => {
    let filtered = currencies
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      filtered = filtered.filter(
        (c) =>
          c.code.toLowerCase().includes(query) ||
          c.name.toLowerCase().includes(query) ||
          c.name
            .toLowerCase()
            .split(" ")
            .some((w) => w.startsWith(query)),
      )
    }
    const sel = filtered.find((c) => c.code === selectedCurrency)
    const rest = filtered.filter((c) => c.code !== selectedCurrency)
    rest.sort((a, b) => a.code.localeCompare(b.code))
    return sel ? [sel, ...rest] : rest
  }, [currencies, searchQuery, selectedCurrency])

  const handleSelect = useCallback(
    (code: string) => {
      track("ek_select_payment_currency_markets_payment_currency", { currency_code: code })
      onCurrencySelect(code)
      setIsOpen(false)
      setSearchQuery("")
    },
    [onCurrencySelect, track],
  )

  const closeDropdown = useCallback(() => {
    setIsOpen(false)
    setSearchQuery("")
  }, [])

  const openDropdown = useCallback(() => {
    if (disabled) return
    setIsOpen(true)
    onOpen?.()
  }, [disabled, onOpen])

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (open) openDropdown()
      else closeDropdown()
    },
    [openDropdown, closeDropdown],
  )

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

  // Position portal dropdown
  useLayoutEffect(() => {
    if (!isOpen || isMobile || !triggerRef.current) {
      setDropdownStyle(null)
      return
    }
    const rect = triggerRef.current.getBoundingClientRect()
    const dropdownH = 300
    const spaceBelow = window.innerHeight - rect.bottom
    const openUpward = spaceBelow < dropdownH && rect.top > dropdownH
    setDropdownStyle(
      openUpward
        ? { bottom: window.innerHeight - rect.top + 4, right: window.innerWidth - rect.right, width: Math.max(rect.width, 320) }
        : { top: rect.bottom + 4, right: window.innerWidth - rect.right, width: Math.max(rect.width, 320) },
    )
  }, [isOpen, isMobile])

  // Focus search on desktop open
  useEffect(() => {
    if (!isOpen || isMobile) return
    const id = requestAnimationFrame(() => searchRef.current?.focus())
    return () => cancelAnimationFrame(id)
  }, [isOpen, isMobile])

  const flagSrc = currencyFlagMapper[selectedCurrency as keyof typeof currencyFlagMapper]

  const triggerButton = (
    <Button
      ref={triggerRef}
      variant="outline"
      data-testid={triggerTestId ?? "currency-filter-btn-trigger"}
      disabled={disabled}
      onClick={() => (isOpen ? closeDropdown() : openDropdown())}
      aria-expanded={isOpen}
      aria-haspopup="listbox"
      className={cn(
        "!h-12 !w-full !rounded-lg !border !border-solid !border-neutral-200 !bg-white !px-3 !text-sm !font-normal focus:!ring-1 focus:!ring-black [&>span]:!w-full",
        triggerClassName,
      )}
    >
      <span className="flex w-full flex-row items-center justify-between">
        <span className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden">
          {flagSrc && (
            <Image
              src={flagSrc}
              alt={`${selectedCurrency} flag`}
              width={24}
              height={16}
              className="min-w-6 w-6 shrink-0 object-cover"
            />
          )}
          <span className="truncate">{selectedCurrency || (placeholder ?? t("common.select"))}</span>
        </span>
        {isOpen && !isMobile ? (
          <StandaloneChevronUpRegularIcon iconSize="xs" fill="currentColor" className="ms-1.5 shrink-0" />
        ) : (
          <StandaloneChevronDownRegularIcon iconSize="xs" fill="currentColor" className="ms-1.5 shrink-0" />
        )}
      </span>
    </Button>
  )

  const listContent = (isSheet: boolean) => (
    <div className="flex h-full flex-col">
      <div
        className={cn(
          "flex items-center gap-2 rounded-lg bg-black/[0.04] px-2",
          isSheet ? "mx-4 mb-2 h-10" : "m-4 h-9",
        )}
      >
        <StandaloneSearchRegularIcon iconSize="xs" className="shrink-0 text-neutral-400" aria-hidden />
        <input
          ref={isSheet ? undefined : searchRef}
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Escape") closeDropdown() }}
          placeholder={t("common.search")}
          className="min-w-0 flex-1 border-0 bg-transparent text-sm outline-none placeholder:text-neutral-400"
          data-testid="currency-filter-input-search"
        />
      </div>
      <div className="flex-1 overflow-y-auto py-1" role="listbox">
        {filteredCurrencies.length === 0 ? (
          <div className="flex min-h-[160px] items-center justify-center">
            <EmptyState
              title={t("filter.currencyUnavailable", { currency: searchQuery })}
              description={t("filter.selectAnotherCurrency")}
              redirectToAds={false}
            />
          </div>
        ) : (
          filteredCurrencies.map((currency) => (
            <button
              key={currency.code}
              type="button"
              role="option"
              aria-selected={currency.code === selectedCurrency}
              onClick={() => handleSelect(currency.code)}
              data-testid={`currency-filter-btn-${currency.code}`}
              className={cn(
                "flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-start text-sm transition-colors",
                "hover:bg-neutral-50",
                currency.code === selectedCurrency
                  ? "bg-neutral-50 font-medium text-neutral-800"
                  : "text-neutral-700",
              )}
            >
              {currencyFlagMapper[currency.code as keyof typeof currencyFlagMapper] && (
                <Image
                  src={currencyFlagMapper[currency.code as keyof typeof currencyFlagMapper]}
                  alt={`${currency.code} flag`}
                  width={24}
                  height={16}
                  className="shrink-0 object-cover"
                />
              )}
              <span>
                {currency.code} - {currency.name}
              </span>
            </button>
          ))
        )}
      </div>
    </div>
  )

  if (isMobile) {
    return (
      <>
        {triggerButton}
        <Drawer open={isOpen} onOpenChange={handleOpenChange}>
          <DrawerContent side="bottom" className="flex h-[85vh] flex-col overflow-hidden rounded-t-2xl">
            <div className="my-4 shrink-0 px-4">
              <h3 className="text-center text-xl font-extrabold text-slate-1200">
                {title ?? t("common.select")}
              </h3>
            </div>
            <div className="min-h-0 flex-1 overflow-hidden pb-4">{listContent(true)}</div>
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
            <div className="flex h-72 flex-col overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-lg">
              {listContent(false)}
            </div>
          </div>,
          document.body,
        )}
    </>
  )
}
