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
  isEditMode?: boolean
}

interface ValidationErrors {
  totalAmount?: string
  fixedRate?: string
  minAmount?: string
  maxAmount?: string
}

export default function AdDetailsForm({ onNext, onClose, initialData, isEditMode }: AdDetailsFormProps) {
  // Initialize state with initialData values or defaults
  const [type, setType] = useState<"buy" | "sell">(initialData?.type || "buy")
  const [totalAmount, setTotalAmount] = useState(initialData?.totalAmount?.toString() || "")
  const [fixedRate, setFixedRate] = useState(initialData?.fixedRate?.toString() || "")
  const [minAmount, setMinAmount] = useState(initialData?.minAmount?.toString() || "")
  const [maxAmount, setMaxAmount] = useState(initialData?.maxAmount?.toString() || "")
  const [formErrors, setFormErrors] = useState<ValidationErrors>({})
  const [touched, setTouched] = useState({
    totalAmount: false,
    fixedRate: false,
    minAmount: false,
    maxAmount: false,
  })

  // Check if form is valid for enabling/disabling the Next button
  const isFormValid = () => {
    const hasValues = totalAmount && fixedRate && minAmount && maxAmount
    const hasNoErrors = Object.keys(formErrors).length === 0
    const allFieldsValid = hasValues && hasNoErrors
    return allFieldsValid
  }

  // Update state when initialData changes (important for edit mode)
  useEffect(() => {
    if (initialData) {
      if (initialData.type) setType(initialData.type as "buy" | "sell")
      if (initialData.totalAmount !== undefined) setTotalAmount(initialData.totalAmount.toString())
      if (initialData.fixedRate !== undefined) setFixedRate(initialData.fixedRate.toString())
      if (initialData.minAmount !== undefined) setMinAmount(initialData.minAmount.toString())
      if (initialData.maxAmount !== undefined) setMaxAmount(initialData.maxAmount.toString())
    }
  }, [initialData])

  // Validate form when values change
  useEffect(() => {
    const errors: ValidationErrors = {}
    const total = Number(totalAmount)
    const min = Number(minAmount)
    const max = Number(maxAmount)
    const rate = Number(fixedRate)

    // Only validate fields that have been touched
    if (touched.totalAmount) {
      if (!totalAmount) {
        errors.totalAmount = "Total amount is required"
      } else if (total <= 0) {
        errors.totalAmount = "Total amount must be greater than 0"
      } else if (touched.minAmount && min > total) {
        errors.totalAmount = "Total amount must be equal or more than minimum"
      }
    }

    if (touched.fixedRate) {
      if (!fixedRate) {
        errors.fixedRate = "Rate is required"
      } else if (rate <= 0) {
        errors.fixedRate = "Rate must be greater than 0"
      }
    }

    if (touched.minAmount) {
      if (!minAmount) {
        errors.minAmount = "Minimum amount is required"
      } else if (min <= 0) {
        errors.minAmount = "Minimum amount must be greater than 0"
      } else if (touched.totalAmount && min > total) {
        errors.minAmount = "Must be equal or less than total amount"
      }
    }

    if (touched.maxAmount) {
      if (!maxAmount) {
        errors.maxAmount = "Maximum amount is required"
      } else if (max <= 0) {
        errors.maxAmount = "Maximum amount must be greater than 0"
      } else if (touched.minAmount && max < min) {
        errors.maxAmount = "Must be equal or more than minimum"
      }
    }

    setFormErrors(errors)
  }, [totalAmount, fixedRate, minAmount, maxAmount, touched])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Mark all fields as touched to show any errors
    setTouched({
      totalAmount: true,
      fixedRate: true,
      minAmount: true,
      maxAmount: true,
    })

    // Check for validation errors
    if (!isFormValid()) {
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

    onNext(formData)
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-6 border-b relative">
        <h2 className="text-xl font-semibold text-center">{isEditMode ? "Edit ad details" : "Enter ad details"}</h2>
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
                      onBlur={() => setTouched((prev) => ({ ...prev, totalAmount: true }))}
                      placeholder="0.00"
                      required
                      min="0.01"
                      step="0.01"
                      className={`text-left pl-3 pr-16 h-10 transition-all duration-200 ${
                        touched.totalAmount && formErrors.totalAmount
                          ? "border-red-500 focus:border-red-500 border-2"
                          : "border-gray-200 focus:border-black hover:border-gray-300"
                      }`}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">USD</span>
                  </div>
                  {touched.totalAmount && formErrors.totalAmount && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.totalAmount}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm text-gray-500 mb-2 block">Fixed rate</label>
                  <div className="relative">
                    <Input
                      type="number"
                      value={fixedRate}
                      onChange={(e) => setFixedRate(e.target.value)}
                      onBlur={() => setTouched((prev) => ({ ...prev, fixedRate: true }))}
                      placeholder="0.00"
                      required
                      min="0.01"
                      step="0.01"
                      className={`text-left pl-3 pr-16 h-10 transition-all duration-200 ${
                        touched.fixedRate && formErrors.fixedRate
                          ? "border-red-500 focus:border-red-500 border-2"
                          : "border-gray-200 focus:border-black hover:border-gray-300"
                      }`}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">IDR</span>
                  </div>
                  {touched.fixedRate && formErrors.fixedRate && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.fixedRate}</p>
                  )}
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
                      onBlur={() => setTouched((prev) => ({ ...prev, minAmount: true }))}
                      placeholder="0.00"
                      required
                      min="0.01"
                      step="0.01"
                      className={`text-left pl-3 pr-16 h-10 transition-all duration-200 ${
                        touched.minAmount && formErrors.minAmount
                          ? "border-red-500 focus:border-red-500 border-2"
                          : "border-gray-200 focus:border-black hover:border-gray-300"
                      }`}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">USD</span>
                  </div>
                  {touched.minAmount && formErrors.minAmount && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.minAmount}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm text-gray-500 mb-2 block">Maximum order amount</label>
                  <div className="relative">
                    <Input
                      type="number"
                      value={maxAmount}
                      onChange={(e) => setMaxAmount(e.target.value)}
                      onBlur={() => setTouched((prev) => ({ ...prev, maxAmount: true }))}
                      placeholder="0.00"
                      required
                      min="0.01"
                      step="0.01"
                      className={`text-left pl-3 pr-16 h-10 transition-all duration-200 ${
                        touched.maxAmount && formErrors.maxAmount
                          ? "border-red-500 focus:border-red-500 border-2"
                          : "border-gray-200 focus:border-black hover:border-gray-300"
                      }`}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">USD</span>
                  </div>
                  {touched.maxAmount && formErrors.maxAmount && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.maxAmount}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* Fixed positioned button at bottom right - using a plain HTML button with direct styling */}
      <div className="fixed bottom-6 right-6">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!isFormValid()}
          className="next-button"
          style={{
            backgroundColor: isFormValid() ? "hsl(var(--primary))" : "#E5E7EB",
            color: isFormValid() ? "hsl(var(--primary-foreground))" : "#9CA3AF",
            borderRadius: "9999px",
            padding: "0.625rem 2rem",
            fontSize: "0.875rem",
            fontWeight: "500",
            border: "none",
            outline: "none",
            cursor: isFormValid() ? "pointer" : "not-allowed",
            transition: "background-color 0.2s",
            boxShadow: "none",
            position: "relative",
            zIndex: 10,
          }}
        >
          Next
        </button>
      </div>
    </div>
  )
}

