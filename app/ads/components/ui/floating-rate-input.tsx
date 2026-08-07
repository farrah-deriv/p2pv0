"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import { localeToBcp47 } from "@/lib/i18n/config"
import { useTranslations } from "@/lib/i18n/use-translations"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface FloatingRateInputProps {
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  error?: boolean
  errorMsg?: string
  currency?: string
  marketPrice?: number
}

export function FloatingRateInput({
  value,
  onChange,
  onBlur,
  error = false,
  errorMsg = "",
  currency = "IDR",
  marketPrice,
}: FloatingRateInputProps) {
  const { t, locale } = useTranslations()
  const [isFocused, setIsFocused] = useState(false)
  const numberLocale = localeToBcp47(locale)
  const inputRef = useRef<HTMLInputElement>(null)
  const [displayValue, setDisplayValue] = useState(value)

  useEffect(() => {
    if (!isFocused) {
      setDisplayValue(value)
    }
  }, [value, isFocused])

  const handleIncrement = () => {
    const currentValue = Number.parseFloat(value) || 0
    const newValue = Math.min(currentValue + 0.01, 100)
    onChange(newValue?.toFixed(2))
  }

  const handleDecrement = () => {
    const currentValue = Number.parseFloat(value) || 0
    const newValue = Math.max(currentValue - 0.01, -100)
    onChange(newValue?.toFixed(2))
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value
    const newValue = input.replace(/%/g, "").trim()

    if (!/^-?\d*\.?\d{0,2}$/.test(newValue)) {
      return
    }

    setDisplayValue(newValue)

    if (newValue === "" || newValue === "-" || newValue === "." || newValue === "-.") {
      onChange(newValue)
      return
    }

    if (/^-?\d*\.?\d{0,2}$/.test(newValue)) {
      const numValue = Number.parseFloat(newValue)

      if (newValue.endsWith(".") || newValue === "-0" || isNaN(numValue)) {
        onChange(newValue)
      } else if (numValue >= -100 && numValue <= 100) {
        onChange(newValue)
      }
    }
  }

  const handleBlur = () => {
    setIsFocused(false)
    setDisplayValue(value)
    onBlur?.()
  }

  const handleFocus = () => {
    setIsFocused(true)
    setDisplayValue(value)
  }

  const showFloating = isFocused || value.length > 0
  const ratePercentage = Number.parseFloat(value) || 0
  const yourPrice = marketPrice ? marketPrice * (1 + ratePercentage / 100) : null

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <div
            className={cn(
              "flex rounded-lg overflow-hidden border transition-colors duration-200 bg-white",
              error ? "border-error" : "border-gray-200",
            )}
          >
            <div className="flex-1 relative">
              <Input
                ref={inputRef}
                type="text"
                value={`${displayValue}%`}
                onChange={handleChange}
                onBlur={handleBlur}
                onFocus={handleFocus}
                placeholder=""
                aria-invalid={error}
                className={cn("pe-8 border-0 h-[56px] text-start text-grayscale-600", error ? "text-destructive" : "")}
              />
            </div>

            <div className="flex items-center gap-2 px-3 bg-white">
              <Button type="button" onClick={handleDecrement} variant="ghost" size="sm" className="h-8 w-8 p-0 text-lg">
                <Image src="/icons/minus.svg" alt={t("common.decrement")} />
              </Button>
              <Button type="button" onClick={handleIncrement} variant="ghost" size="sm" className="h-8 w-8 p-0 text-lg">
                <Image src="/icons/plus.svg" alt={t("common.increment")} />
              </Button>
            </div>
          </div>
          {error && <p className="text-destructive text-xs mt-1 ms-4" data-testid="ad-form-error-rate">{errorMsg}</p>}
          <div className="text-xs text-grayscale-text-muted ms-4 mt-1 text-start">
            {t("adForm.currentMarketPrice")}{" "}
            {marketPrice ? (
              <span>
                {Number(marketPrice).toLocaleString(numberLocale, {
                  minimumFractionDigits: 6,
                  maximumFractionDigits: 6,
                })}{" "}
                {currency}
              </span>
            ) : (
              <span className="text-slate-1200">-</span>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-grayscale-text-muted">{t("adForm.yourRate")}</span>
        {yourPrice ? (
          <span className="text-slate-1200">
            {yourPrice.toLocaleString(numberLocale, {
              minimumFractionDigits: 6,
              maximumFractionDigits: 6,
            })}{" "}
            <span className="text-xs font-normal">{currency}</span>
          </span>
        ) : (
          <span className="text-slate-1200">-</span>
        )}
      </div>
    </div>
  )
}
