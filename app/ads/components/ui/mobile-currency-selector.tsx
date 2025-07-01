"use client"

import { ChevronDown } from "lucide-react"

interface MobileCurrencySelectorProps {
  value: string
  onOpen: () => void
  placeholder?: string
  className?: string
}

export function MobileCurrencySelector({
  value,
  onOpen,
  placeholder = "Select currency",
  className = "",
}: MobileCurrencySelectorProps) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className={`w-full h-14 px-3 py-2 bg-white border border-input rounded-lg text-left flex items-center justify-between hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${className}`}
    >
      <span className="text-sm">{value || placeholder}</span>
      <ChevronDown className="h-4 w-4 opacity-50" />
    </button>
  )
}
