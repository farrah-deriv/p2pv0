"use client"

import { useState } from "react"
import Image from "next/image"
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { useIsMobile } from "@/hooks/use-mobile"
import { Tooltip, TooltipArrow, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { StandaloneChevronDownRegularIcon, StandaloneChevronUpRegularIcon } from "@deriv/quill-icons/Standalone"
import { isRtlLocale } from "@/lib/i18n/config"
import { useTranslations } from "@/lib/i18n/use-translations"
import { cn } from "@/lib/utils"

export type PriceType = "fixed" | "float"

interface PriceTypeSelectorProps {
  marketPrice: number | null
  value: PriceType
  onChange: (value: PriceType) => void
  disabled?: boolean
  isFloatingRateEnabled?: boolean
}

export function PriceTypeSelector({ marketPrice, value, onChange, disabled = false, isFloatingRateEnabled = false }: PriceTypeSelectorProps) {
  const [open, setOpen] = useState(false)
  const isMobile = useIsMobile()
  const { t, locale } = useTranslations()
  const dir = isRtlLocale(locale) ? "rtl" : "ltr"
  const textAlignClass = "w-full flex-1 text-start"

  const rateTypeLabel = value === "fixed" ? t("adForm.fixed") : t("adForm.floating")

  const handleSelect = (newValue: PriceType) => {
    onChange(newValue)
    setOpen(false)
  }

  const triggerButton = (
    <Button
      variant="outline"
      disabled={disabled}
      className="!h-12 !w-full !rounded-lg !border !border-solid !border-neutral-200 !bg-white !px-3 !text-sm !font-normal focus:!ring-1 focus:!ring-black [&>span]:!w-full"
    >
      <span className="flex w-full flex-row items-center justify-between">
        <span className={cn("truncate", textAlignClass)}>{rateTypeLabel}</span>
        {open
          ? <StandaloneChevronUpRegularIcon iconSize="xs" fill="currentColor" className="ms-1.5 shrink-0" />
          : <StandaloneChevronDownRegularIcon iconSize="xs" fill="currentColor" className="ms-1.5 shrink-0" />
        }
      </span>
    </Button>
  )

  const content = (
    <RadioGroup value={value} onValueChange={handleSelect} disabled={disabled}>
      <Label
        htmlFor="fixed"
        data-testid="ad-form-radio-price-fixed"
        className={`font-normal flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-colors bg-grayscale-500 ${value === "fixed"
          ? "border-black"
          : "border-grayscale-500"
          } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        <div className={cn(textAlignClass)}>
          <div className="text-base mb-1 text-slate-1200">{t("adForm.fixed")}</div>
          <div className="text-xs text-grayscale-text-muted">
            {t("order.fixedRateDescription")}
          </div>
        </div>
        <RadioGroupItem value="fixed" id="fixed" className="hidden mt-1 ms-4 h-6 w-6" />
      </Label>

      <Label
        htmlFor="float"
        data-testid="ad-form-radio-price-floating"
        className={`font-normal flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-colors bg-grayscale-500 ${value === "float"
          ? "border-black"
          : "border-grayscale-500"
          } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        <div className={cn(textAlignClass)}>
          <div className="text-base text-slate-1200 mb-1">{t("adForm.floating")}</div>
          <div className="text-xs text-grayscale-text-muted">
            {t("order.floatingRateDescription")}
          </div>
        </div>
        <RadioGroupItem value="float" id="float" className="hidden mt-1 ms-4 h-6 w-6" />
      </Label>
    </RadioGroup>
  )

  return (
    <TooltipProvider>
      <div dir={dir}>
        {!marketPrice || !isFloatingRateEnabled ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                disabled={disabled}
                className="!h-12 !w-full !rounded-lg !border !border-solid !border-neutral-200 !bg-white !px-3 !text-sm !font-normal [&>span]:!w-full"
              >
                <span className="flex w-full flex-row items-center justify-between">
                  <span className={cn("truncate", textAlignClass)}>{t("adForm.fixed")}</span>
                  <Image src="/icons/info-circle.svg" alt={t("common.info")} width={16} height={16} className="ms-1.5 shrink-0 cursor-pointer" />
                </span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-white">{t("order.fixedRateDescription")}</p>
              <TooltipArrow className="fill-black" />
            </TooltipContent>
          </Tooltip>
        ) : (
          isMobile ? (
            <Drawer open={open} onOpenChange={setOpen}>
              <DrawerTrigger asChild>{triggerButton}</DrawerTrigger>
              <DrawerContent dir={dir}>
                <div className="px-4 pb-6">
                  <div className="py-4">
                    <h3 className="text-xl font-bold text-center">{t("order.rateType")}</h3>
                  </div>
                  {content}
                </div>
              </DrawerContent>
            </Drawer>
          ) : (
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>{triggerButton}</PopoverTrigger>
              <PopoverContent
                align="start"
                sideOffset={4}
                className="p-2 rounded-xl border border-neutral-200 shadow-lg"
                style={{ width: "var(--radix-popover-trigger-width)" }}
              >
                {content}
              </PopoverContent>
            </Popover>
          )
        )}
      </div>
    </TooltipProvider>
  )
}
