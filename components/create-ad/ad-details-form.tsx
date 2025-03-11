"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { X } from "lucide-react"
import type { AdFormData } from "@/lib/types/ad"

interface AdDetailsFormProps {
  onNext: (data: Partial<AdFormData>) => void
  onClose: () => void
  initialData?: Partial<AdFormData>
}

export default function AdDetailsForm({ onNext, onClose, initialData }: AdDetailsFormProps) {
  const [type, setType] = useState<"buy" | "sell">(initialData?.type || "buy")
  const [totalAmount, setTotalAmount] = useState(initialData?.totalAmount?.toString() || "")
  const [fixedRate, setFixedRate] = useState(initialData?.fixedRate?.toString() || "")
  const [minAmount, setMinAmount] = useState(initialData?.minAmount?.toString() || "")
  const [maxAmount, setMaxAmount] = useState(initialData?.maxAmount?.toString() || "")
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  // Validate form when values change
  useEffect(() => {
    const errors: Record<string, string> = {}

    if (totalAmount && Number.parseFloat(totalAmount) <= 0) {
      errors.totalAmount = "Total amount must be greater than 0"
    }

    if (fixedRate && Number.parseFloat(fixedRate) <= 0) {
      errors.fixedRate = "Fixed rate must be greater than 0"
    }

    if (minAmount && Number.parseFloat(minAmount) <= 0) {
      errors.minAmount = "Minimum amount must be greater than 0"
    }

    if (maxAmount && Number.parseFloat(maxAmount) <= 0) {
      errors.maxAmount = "Maximum amount must be greater than 0"
    }

    if (minAmount && maxAmount && Number.parseFloat(minAmount) > Number.parseFloat(maxAmount)) {
      errors.minAmount = "Minimum amount cannot be greater than maximum amount"
    }

    setFormErrors(errors)
  }, [totalAmount, fixedRate, minAmount, maxAmount])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Check for validation errors
    if (Object.keys(formErrors).length > 0) {
      console.error("Form has validation errors:", formErrors)
      return
    }

    // Convert string values to numbers
    const formData = {
      type,
      totalAmount: Number.parseFloat(totalAmount) || 0,
      fixedRate: Number.parseFloat(fixedRate) || 0,
      minAmount: Number.parseFloat(minAmount) || 0,
      maxAmount: Number.parseFloat(maxAmount) || 0,
    }

    // Log the form data for debugging
    console.group("📝 Ad Details Form Data")
    console.log("Form Data:", formData)
    console.groupEnd()

    onNext(formData)
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-6 border-b relative">
        <h2 className="text-xl font-semibold text-center">Enter Ad details</h2>
        <button
          onClick={onClose}
          className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <form id="ad-details-form" onSubmit={handleSubmit} className="flex-1 p-6">
        <div className="max-w-[800px] mx-auto h-full flex flex-col justify-between">
          <div className="space-y-12">
            <div>
              <h3 className="text-base font-medium mb-6">Select trade type</h3>
              <div className="flex gap-12">
                <label className="flex items-center gap-3 cursor-pointer">
                  <div className="relative">
                    <input
                      type="radio"
                      name="trade-type"
                      value="buy"
                      checked={type === "buy"}
                      onChange={(e) => setType(e.target.value as "buy" | "sell")}
                      className="peer sr-only"
                    />
                    <div
                      className={`h-6 w-6 rounded-full border-2 transition-colors
                      ${type === "buy" ? "border-red-500" : "border-gray-200"}`}
                    />
                  </div>
                  <span className="text-lg">Buy USD</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <div className="relative">
                    <input
                      type="radio"
                      name="trade-type"
                      value="sell"
                      checked={type === "sell"}
                      onChange={(e) => setType(e.target.value as "buy" | "sell")}
                      className="peer sr-only"
                    />
                    <div
                      className={`h-6 w-6 rounded-full border-2 transition-colors
                      ${type === "sell" ? "border-red-500" : "border-gray-200"}`}
                    />
                  </div>
                  <span className="text-lg">Sell USD</span>
                </label>
              </div>
            </div>

            <div>
              <h3 className="text-base font-medium mb-6">Set amount and rate</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-500 mb-2 block">Total amount</label>
                  <div className="relative">
                    <Input
                      type="number"
                      value={totalAmount}
                      onChange={(e) => setTotalAmount(e.target.value)}
                      placeholder="0.00"
                      required
                      min="0.01"
                      step="0.01"
                      className={`pr-12 h-10 ${formErrors.totalAmount ? "border-red-500" : ""}`}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">USD</span>
                  </div>
                  {formErrors.totalAmount && <p className="text-red-500 text-xs mt-1">{formErrors.totalAmount}</p>}
                </div>
                <div>
                  <label className="text-sm text-gray-500 mb-2 block">Fixed rate</label>
                  <div className="relative">
                    <Input
                      type="number"
                      value={fixedRate}
                      onChange={(e) => setFixedRate(e.target.value)}
                      placeholder="0.00"
                      required
                      min="0.01"
                      step="0.01"
                      className={`pr-12 h-10 ${formErrors.fixedRate ? "border-red-500" : ""}`}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">IDR</span>
                  </div>
                  {formErrors.fixedRate && <p className="text-red-500 text-xs mt-1">{formErrors.fixedRate}</p>}
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-base font-medium mb-6">Order amount limit</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-500 mb-2 block">Minimum order amount</label>
                  <div className="relative">
                    <Input
                      type="number"
                      value={minAmount}
                      onChange={(e) => setMinAmount(e.target.value)}
                      placeholder="0.00"
                      required
                      min="0.01"
                      step="0.01"
                      className={`pr-12 h-10 ${formErrors.minAmount ? "border-red-500" : ""}`}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">USD</span>
                  </div>
                  {formErrors.minAmount && <p className="text-red-500 text-xs mt-1">{formErrors.minAmount}</p>}
                </div>
                <div>
                  <label className="text-sm text-gray-500 mb-2 block">Maximum order amount</label>
                  <div className="relative">
                    <Input
                      type="number"
                      value={maxAmount}
                      onChange={(e) => setMaxAmount(e.target.value)}
                      placeholder="0.00"
                      required
                      min="0.01"
                      step="0.01"
                      className={`pr-12 h-10 ${formErrors.maxAmount ? "border-red-500" : ""}`}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">USD</span>
                  </div>
                  {formErrors.maxAmount && <p className="text-red-500 text-xs mt-1">{formErrors.maxAmount}</p>}
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}

