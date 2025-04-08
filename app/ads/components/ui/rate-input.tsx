"use client"

import type React from "react"
import { AlertTriangle } from "lucide-react"

interface RateInputProps {
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  step?: number
  min?: number
  error?: boolean
}

export function RateInput({ value, onChange, onBlur, step, min, error = false }: RateInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9.]/g, "")
    onChange(value)
  }

  return (
    <div className="flex flex-col">
      <div
        className={`flex rounded-lg overflow-hidden border transition-colors duration-200 ${
          error ? "border-red-500" : "border-gray-200"
        }`}
        style={{ borderWidth: "1px" }}
      >
        <div className="flex-1 flex items-center">
          <input
            type="number"
            value={value}
            onChange={handleChange}
            onBlur={onBlur}
            step={step}
            min={min}
            placeholder="0.00"
            className="flex-1 p-4 border-0 focus:ring-0 focus:outline-none text-gray-900 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            aria-invalid={error}
          />
          {error && (
            <div className="flex items-center justify-center pr-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
            </div>
          )}
        </div>
        <div className="flex items-center justify-center bg-gray-50 px-4 text-gray-500 min-w-[80px] text-center">
          IDR
        </div>
      </div>
    </div>
  )
}
