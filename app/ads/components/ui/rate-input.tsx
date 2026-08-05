"use client"

import type React from "react"
import { useState } from "react"
import { AlertTriangle } from "lucide-react"
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
          error ? "border-red-500" : "border-gray-200"
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
            className="w-full p-4 pt-6 border-0 focus:ring-0 focus:outline-none text-start text-gray-900 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none h-[56px]"
            aria-invalid={error}
            data-testid="ad-form-input-rate"
          />

          <label
            className={cn(
              "absolute start-3 pointer-events-none transition-all duration-200",
              showFloating ? "text-xs top-2 bg-white px-1" : "text-sm top-1/2 -translate-y-1/2",
              error ? "text-red-500" : "text-black/70",
            )}
          >
            {label}
          </label>

          {error && (
            <div className="absolute end-2 top-1/2 transform -translate-y-1/2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
            </div>
          )}
        </div>

        <div className="flex items-center justify-center bg-gray-50 px-4 text-gray-500 min-w-[80px] text-center">
        {currency}
        </div>
      </div>
    </div>
  )
}
