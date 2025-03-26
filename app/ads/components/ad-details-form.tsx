"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { X } from "lucide-react"
import type { AdFormData } from "../types"
import { useIsMobile } from "@/hooks/use-mobile"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"

interface AdDetailsFormProps {
  onNext: (data: Partial<AdFormData>, errors?: ValidationErrors) => void
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
  const isMobile = useIsMobile()

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
    // Check if all required fields have values
    const hasValues = !!totalAmount && !!fixedRate && !!minAmount && !!maxAmount

    // Check if there are no validation errors
    const hasNoErrors = Object.keys(formErrors).length === 0

    // Both conditions must be true
    return hasValues && hasNoErrors
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

      // Pass the data along with the errors to the parent
      const formData = {
        type,
        totalAmount: Number.parseFloat(totalAmount) || 0,
        fixedRate: Number.parseFloat(fixedRate) || 0,
        minAmount: Number.parseFloat(minAmount) || 0,
        maxAmount: Number.parseFloat(maxAmount) || 0,
      }

      onNext(formData, formErrors)
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

  useEffect(() => {
    // This will run whenever the form validation state changes
    const isValid = isFormValid()
    // Use a custom event to communicate the form state to the parent
    const event = new CustomEvent("adFormValidationChange", {
      bubbles: true,
      detail: {
        isValid,
        formData: {
          type,
          totalAmount: Number.parseFloat(totalAmount) || 0,
          fixedRate: Number.parseFloat(fixedRate) || 0,
          minAmount: Number.parseFloat(minAmount) || 0,
          maxAmount: Number.parseFloat(maxAmount) || 0,
        },
      },
    })
    document.dispatchEvent(event)
  }, [totalAmount, fixedRate, minAmount, maxAmount, formErrors])

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
              <RadioGroup
                value={type}
                onValueChange={(value) => setType(value as "buy" | "sell")}
                className="flex gap-12"
                defaultValue="buy"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="buy" id="buy" aria-label="Buy USD" />
                  <Label htmlFor="buy" className="text-lg cursor-pointer">
                    Buy USD
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="sell" id="sell" aria-label="Sell USD" />
                  <Label htmlFor="sell" className="text-lg cursor-pointer">
                    Sell USD
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <h3 className="text-base font-medium mb-6">Set amount and rate</h3>
              <div className={`${isMobile ? "space-y-4" : "grid grid-cols-2 gap-4"}`}>
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
                      className="pr-12"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">USD</span>
                  </div>
                  {touched.totalAmount && formErrors.totalAmount && (
                    <p className="text-xs mt-1">{formErrors.totalAmount}</p>
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
                      className="pr-12"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">IDR</span>
                  </div>
                  {touched.fixedRate && formErrors.fixedRate && <p className="text-xs mt-1">{formErrors.fixedRate}</p>}
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-base font-medium mb-6">Order amount limit</h3>
              <div className={`${isMobile ? "space-y-4" : "grid grid-cols-2 gap-4"}`}>
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
                      className="pr-12"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">USD</span>
                  </div>
                  {touched.minAmount && formErrors.minAmount && <p className="text-xs mt-1">{formErrors.minAmount}</p>}
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
                      className="pr-12"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">USD</span>
                  </div>
                  {touched.maxAmount && formErrors.maxAmount && <p className="text-xs mt-1">{formErrors.maxAmount}</p>}
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}

