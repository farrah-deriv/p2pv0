"use client"

import { useState, useRef, useLayoutEffect, useEffect, useCallback } from "react"
import Image from "next/image"
import { createPortal } from "react-dom"
import { Drawer, DrawerContent } from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Tooltip, TooltipArrow, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useIsMobile } from "@/hooks/use-mobile"
import { isRtlLocale } from "@/lib/i18n/config"
import { useTranslations } from "@/lib/i18n/use-translations"
import { cn } from "@/lib/utils"
import {
  StandaloneChevronDownRegularIcon,
  StandaloneChevronUpRegularIcon,
} from "@deriv/quill-icons/Standalone"

export type PriceType = "fixed" | "float"

interface PriceTypeSelectorProps {
  marketPrice: number | null
  value: PriceType
  onChange: (value: PriceType) => void
  disabled?: boolean
  isFloatingRateEnabled?: boolean
}

export function PriceTypeSelector({
  marketPrice,
  value,
  onChange,
  disabled = false,
  isFloatingRateEnabled = false,
}: PriceTypeSelectorProps) {
  const [open, setOpen] = useState(false)
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties | null>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const isMobile = useIsMobile()
  const { t, locale } = useTranslations()
  const dir = isRtlLocale(locale) ? "rtl" : "ltr"

  const canChooseRateType = Boolean(marketPrice && isFloatingRateEnabled)
  const rateTypeLabel = value === "fixed" ? t("adForm.fixed") : t("adForm.floating")

  const close = useCallback(() => setOpen(false), [])

  const handleSelect = useCallback(
    (next: PriceType) => {
      onChange(next)
      close()
    },
    [onChange, close],
  )

  // Close on outside click (desktop)
  useEffect(() => {
    if (!open || isMobile) return
    const onMouseDown = (e: MouseEvent) => {
      const target = e.target as Node
      if (!triggerRef.current?.contains(target) && !dropdownRef.current?.contains(target)) {
        close()
      }
    }
    document.addEventListener("mousedown", onMouseDown)
    return () => document.removeEventListener("mousedown", onMouseDown)
  }, [open, isMobile, close])

  // Position portal dropdown under the trigger
  useLayoutEffect(() => {
    if (!open || isMobile || !triggerRef.current) {
      setDropdownStyle(null)
      return
    }
    const rect = triggerRef.current.getBoundingClientRect()
    const dropdownH = 200
    const spaceBelow = window.innerHeight - rect.bottom
    const openUpward = spaceBelow < dropdownH && rect.top > dropdownH
    setDropdownStyle(
      openUpward
        ? { bottom: window.innerHeight - rect.top + 4, left: rect.left, width: rect.width }
        : { top: rect.bottom + 4, left: rect.left, width: rect.width },
    )
  }, [open, isMobile])

  const radioContent = (
    <RadioGroup value={value} onValueChange={(v) => handleSelect(v as PriceType)} disabled={disabled}>
      <Label
        htmlFor="fixed"
        data-testid="ad-form-radio-price-fixed"
        className={cn(
          "font-normal flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-colors bg-grayscale-500",
          value === "fixed" ? "border-black" : "border-grayscale-500",
          disabled && "opacity-50 cursor-not-allowed",
        )}
      >
        <div className="w-full flex-1 text-start">
          <div className="text-base mb-1 text-slate-1200">{t("adForm.fixed")}</div>
          <div className="text-xs text-grayscale-text-muted">{t("order.fixedRateDescription")}</div>
        </div>
        <RadioGroupItem value="fixed" id="fixed" className="hidden mt-1 ms-4 h-6 w-6" />
      </Label>

      <Label
        htmlFor="float"
        data-testid="ad-form-radio-price-floating"
        className={cn(
          "font-normal flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-colors bg-grayscale-500",
          value === "float" ? "border-black" : "border-grayscale-500",
          disabled && "opacity-50 cursor-not-allowed",
        )}
      >
        <div className="w-full flex-1 text-start">
          <div className="text-base text-slate-1200 mb-1">{t("adForm.floating")}</div>
          <div className="text-xs text-grayscale-text-muted">{t("order.floatingRateDescription")}</div>
        </div>
        <RadioGroupItem value="float" id="float" className="hidden mt-1 ms-4 h-6 w-6" />
      </Label>
    </RadioGroup>
  )

  const triggerButton = (
    <Button
      ref={triggerRef}
      type="button"
      variant="outline"
      disabled={disabled}
      onClick={() => setOpen((o) => !o)}
      aria-expanded={open}
      aria-haspopup="listbox"
      className="!h-12 !w-full !rounded-lg !border !border-solid !border-neutral-200 !bg-white !px-3 !text-sm !font-normal focus:!ring-1 focus:!ring-black [&>span]:!w-full"
    >
      <span className="flex w-full flex-row items-center justify-between">
        <span className="truncate text-slate-1200">{rateTypeLabel}</span>
        {open && !isMobile ? (
          <StandaloneChevronUpRegularIcon iconSize="xs" fill="currentColor" className="ms-1.5 shrink-0" />
        ) : (
          <StandaloneChevronDownRegularIcon iconSize="xs" fill="currentColor" className="ms-1.5 shrink-0" />
        )}
      </span>
    </Button>
  )

  return (
    <TooltipProvider>
      <div className="space-y-4" dir={dir}>
        {!canChooseRateType ? (
          <div className="flex items-center">
            <h3 className="text-sm font-normal leading-5 tracking-normal text-slate-1200">
              {t("adForm.rateFixedTitle")}
            </h3>
            <Tooltip>
              <TooltipTrigger asChild>
                <Image
                  src="/icons/info-circle.svg"
                  alt={t("common.info")}
                  width={24}
                  height={24}
                  className="ms-1 cursor-pointer flex-shrink-0"
                />
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-white">{t("order.fixedRateDescription")}</p>
                <TooltipArrow className="fill-black" />
              </TooltipContent>
            </Tooltip>
          </div>
        ) : (
          <>
            <h3 className="text-sm font-normal leading-5 tracking-normal text-start text-slate-1200">
              {t("myAds.rate")}
            </h3>
            {triggerButton}
            {isMobile ? (
              <Drawer open={open} onOpenChange={setOpen}>
                <DrawerContent dir={dir}>
                  <div className="px-4 pb-6">
                    <div className="pt-3 pb-4">
                      <h3 className="text-xl font-extrabold text-center">{t("order.rateType")}</h3>
                    </div>
                    {radioContent}
                  </div>
                </DrawerContent>
              </Drawer>
            ) : (
              open &&
              dropdownStyle &&
              typeof document !== "undefined" &&
              createPortal(
                <div ref={dropdownRef} className="fixed z-50" style={dropdownStyle}>
                  <div className="flex flex-col overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-lg p-4 gap-3">
                    {radioContent}
                  </div>
                </div>,
                document.body,
              )
            )}
          </>
        )}
      </div>
    </TooltipProvider>
  )
}
