"use client"

import type React from "react"
import { useState } from "react"
import { cn } from "@/lib/utils"

interface RateInputProps {
  currency: string
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  step?: number
  min?: number
  error?: boolean
  label?: string
}

export function RateInput({
   currency,
  value,
  onChange,
  onBlur,
  step,
  min,
  error = false,
  label = "Enter Value",
}: RateInputProps) {
  const [isFocused, setIsFocused] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value.replace(/[^0-9.]/g, "")
    onChange(newValue)
  }

  const showFloating = isFocused || value.length > 0

  return (
    <div className="flex flex-col relative">
      <div
        className={cn(
          "flex rounded-lg overflow-hidden border transition-colors duration-200",
          error ? "border-error" : "border-gray-200"
        )}
      >
        <div className="flex-1 relative">
          <input
            type="number"
            value={value}
            onChange={handleChange}
            onBlur={() => {
              setIsFocused(false)
              onBlur?.()
            }}
            onFocus={() => setIsFocused(true)}
            onWheel={(e) => e.currentTarget.blur()}
            step={step}
            min={min}
            placeholder=""
            // Match MinimumTierSelector floating field: pt-6 pb-2 keeps label→value gap.
            className="w-full h-[56px] px-4 pt-6 pb-2 border-0 focus:ring-0 focus:outline-none text-base font-normal text-start text-gray-900 leading-5 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            aria-invalid={error}
            data-testid="ad-form-input-rate"
          />

          <label
            className={cn(
              "absolute start-[14px] pointer-events-none transition-all duration-200 font-normal",
              showFloating
                ? "text-[12px] top-2 bg-white px-1"
                : "text-base top-1/2 -translate-y-1/2",
              error ? "text-error" : "text-black/70",
            )}
          >
            {label}
          </label>
        </div>

        <div className="flex items-center justify-center px-4 text-neutral-600 min-w-[80px] text-center">
        {currency}
        </div>
      </div>
    </div>
  )
}
