"use client"

import { useState } from "react"
import Image from "next/image"
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { useIsMobile } from "@/hooks/use-mobile"
import { Tooltip, TooltipArrow, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Select } from "@/components/ui/select"
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
      className="w-full h-[56px] max-h-[56px] rounded-lg justify-between px-4 border border-gray-200 hover:bg-transparent font-normal bg-transparent"
    >
      <span className={cn("text-grayscale-600", textAlignClass)}>{rateTypeLabel}</span>
      <Image src="/icons/chevron-down.png" alt={t("common.arrow")} width={24} height={24} className="ms-2 shrink-0" />
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
      <div className="space-y-4" dir={dir}>
        {!marketPrice || !isFloatingRateEnabled ?
          (
            <div className="flex items-center">
              <h3 className="text-lg font-bold leading-6 tracking-normal">{t("adForm.rateFixedTitle")}</h3>
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
          ) :
          (<h3 className="text-lg font-bold leading-6 tracking-normal text-start">{t("order.rateType")}</h3>)
        }
        {marketPrice && isFloatingRateEnabled && (
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
            <Select
              options={[
                { value: "fixed",  label: t("adForm.fixed") },
                { value: "float",  label: t("adForm.floating") },
              ]}
              value={value}
              onChange={(v) => handleSelect(v as PriceType)}
              disabled={disabled}
            />
          )
        )}
      </div>
    </TooltipProvider>
  )
}
