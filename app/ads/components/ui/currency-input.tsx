"use client"

import type React from "react"
import { AlertTriangle } from "lucide-react"

interface CurrencyInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  currency?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  label?: string
  isEditMode?: boolean
  error?: boolean
}

export function CurrencyInput({
  currency = "USD",
  onValueChange,
  placeholder = "0.00",
  value,
  onChange,
  label,
  isEditMode = false,
  disabled,
  error = false,
  ...props
}: CurrencyInputProps) {
  // Combine the isEditMode prop with any existing disabled prop
  const isDisabled = isEditMode || disabled

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only process changes if not in edit mode
    if (!isEditMode) {
      if (onChange) onChange(e)
      if (onValueChange) onValueChange(e.target.value)
    }
  }

  return (
    <div className="flex flex-col">
      <div
        className={`flex rounded-lg overflow-hidden border transition-colors duration-200 ${
          error ? "border-red-500" : isDisabled ? "border-gray-100 bg-gray-50" : "border-gray-200"
        }`}
        style={{ borderWidth: "1px" }}
      >
        <div className="flex-1 flex items-center">
          <input
            type="number"
            value={value}
            onChange={handleChange}
            placeholder={placeholder}
            className={`flex-1 p-4 border-0 focus:ring-0 focus:outline-none ${isDisabled ? "bg-gray-50 text-gray-500 cursor-not-allowed" : "text-gray-900"} [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
            disabled={isDisabled}
            readOnly={isEditMode}
            aria-readonly={isEditMode}
            aria-invalid={error}
            {...props}
          />
          {error && (
            <div className="flex items-center justify-center pr-2">
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
