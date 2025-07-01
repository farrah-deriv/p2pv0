"use client"

import type React from "react"
import { useState, useEffect } from "react"
import type { AdFormData } from "../types"
import { CurrencyInput } from "./ui/currency-input"
import { RateInput } from "./ui/rate-input"
import { TradeTypeSelector } from "./ui/trade-type-selector"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CurrencyBottomSheet } from "./ui/currency-bottom-sheet"
import { MobileCurrencySelector } from "./ui/mobile-currency-selector"
import { useIsMobile } from "@/hooks/use-mobile"

interface AdDetailsFormProps {
  onNext: (data: Partial<AdFormData>, errors?: ValidationErrors) => void
  initialData?: Partial<AdFormData>
  isEditMode?: boolean
}

interface ValidationErrors {
  totalAmount?: string
  fixedRate?: string
  minAmount?: string
  maxAmount?: string
}

export default function AdDetailsForm({ onNext, initialData, isEditMode }: AdDetailsFormProps) {
  const currencies = ["USD", "BTC", "ETH", "LTC", "BRL", "VND"]

  // Initialize state with initialData values or defaults
  const [type, setType] = useState<"buy" | "sell">(initialData?.type || "buy")
  const [totalAmount, setTotalAmount] = useState(initialData?.totalAmount?.toString() || "")
  const [fixedRate, setFixedRate] = useState(initialData?.fixedRate?.toString() || "")
  const [minAmount, setMinAmount] = useState(initialData?.minAmount?.toString() || "")
  const [maxAmount, setMaxAmount] = useState(initialData?.maxAmount?.toString() || "")

  // Use first element as default for currency selections - these are the SINGLE source of truth
  const [buySellCurrency, setBuySellCurrency] = useState(initialData?.buySellCurrency || currencies[0])
  const [forCurrency, setForCurrency] = useState(initialData?.forCurrency || currencies[0])

  const [formErrors, setFormErrors] = useState<ValidationErrors>({})
  const [touched, setTouched] = useState({
    totalAmount: false,
    fixedRate: false,
    minAmount: false,
    maxAmount: false,
  })

  // Mobile bottom sheet states
  const [isBuySellCurrencySheetOpen, setIsBuySellCurrencySheetOpen] = useState(false)
  const [isForCurrencySheetOpen, setIsForCurrencySheetOpen] = useState(false)
  const isMobile = useIsMobile()

  // Debug logging to track state changes
  useEffect(() => {
    console.log("Currency state changed:", { buySellCurrency, forCurrency, isMobile })
  }, [buySellCurrency, forCurrency, isMobile])

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
      if (initialData.buySellCurrency) setBuySellCurrency(initialData.buySellCurrency)
      if (initialData.forCurrency) setForCurrency(initialData.forCurrency)
    }
  }, [initialData])

  // Validation useEffect
  useEffect(() => {
    const errors: ValidationErrors = {}
    const total = Number(totalAmount)
    const min = Number(minAmount)
    const max = Number(maxAmount)
    const rate = Number(fixedRate)

    // Validate total amount
    if (touched.totalAmount) {
      if (!totalAmount) {
        errors.totalAmount = "Total amount is required"
      } else if (total <= 0) {
        errors.totalAmount = "Total amount must be greater than 0"
      }
    }

    // Always validate limits against total amount, regardless of whether total amount was touched
    // This ensures validation works in edit mode where the amount field is disabled
    if (min > total) {
      errors.minAmount = "Minimum amount must be less than total amount"
    }

    if (max > total) {
      errors.maxAmount = "Maximum amount must be less than total amount"
    }

    // Validate fixed rate
    if (touched.fixedRate) {
      if (!fixedRate) {
        errors.fixedRate = "Rate is required"
      } else if (rate <= 0) {
        errors.fixedRate = "Rate must be greater than 0"
      }
    }

    // Validate minimum amount
    if (touched.minAmount) {
      if (!minAmount) {
        errors.minAmount = "Minimum amount is required"
      } else if (min <= 0) {
        errors.minAmount = "Minimum amount must be greater than 0"
      }
    }

    // Check min against max regardless of which was touched
    if (touched.minAmount && touched.maxAmount && min > max) {
      errors.minAmount = "Minimum amount must be less than maximum amount"
      errors.maxAmount = "Maximum amount must be greater than minimum amount"
    }

    // Validate maximum amount
    if (touched.maxAmount) {
      if (!maxAmount) {
        errors.maxAmount = "Maximum amount is required"
      } else if (max <= 0) {
        errors.maxAmount = "Maximum amount must be greater than 0"
      }
    }

    setFormErrors(errors)
  }, [totalAmount, fixedRate, minAmount, maxAmount, touched])

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Mark all fields as touched to show any errors
    setTouched({
      totalAmount: true,
      fixedRate: true,
      minAmount: true,
      maxAmount: true,
    })

    // Perform comprehensive validation
    const total = Number(totalAmount)
    const min = Number(minAmount)
    const max = Number(maxAmount)

    const additionalErrors: ValidationErrors = {}

    // Always check limits against total amount, regardless of mode
    if (min > total) {
      additionalErrors.minAmount = "Minimum amount must be less than total amount"
    }

    if (max > total) {
      additionalErrors.maxAmount = "Maximum amount must be less than total amount"
    }

    // Check min against max
    if (min > max) {
      additionalErrors.minAmount = "Minimum amount must be less than maximum amount"
      additionalErrors.maxAmount = "Maximum amount must be greater than minimum amount"
    }

    // Combine with existing errors
    const combinedErrors = { ...formErrors, ...additionalErrors }

    // Update form errors state
    if (Object.keys(additionalErrors).length > 0) {
      setFormErrors(combinedErrors)
    }

    // Check for validation errors
    if (!isFormValid() || Object.keys(additionalErrors).length > 0) {
      console.error("Form has validation errors:", combinedErrors)

      // Pass the data along with the errors to the parent
      const formData = {
        type,
        totalAmount: Number.parseFloat(totalAmount) || 0,
        fixedRate: Number.parseFloat(fixedRate) || 0,
        minAmount: Number.parseFloat(minAmount) || 0,
        maxAmount: Number.parseFloat(maxAmount) || 0,
        buySellCurrency,
        forCurrency,
      }

      onNext(formData, combinedErrors)
      return
    }

    // Convert string values to numbers
    const formData = {
      type,
      totalAmount: Number.parseFloat(totalAmount) || 0,
      fixedRate: Number.parseFloat(fixedRate) || 0,
      minAmount: Number.parseFloat(minAmount) || 0,
      maxAmount: Number.parseFloat(maxAmount) || 0,
      buySellCurrency,
      forCurrency,
    }

    onNext(formData)
  }

  // Form validation change event
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
          buySellCurrency,
          forCurrency,
        },
      },
    })
    document.dispatchEvent(event)
  }, [totalAmount, fixedRate, minAmount, maxAmount, buySellCurrency, forCurrency, formErrors])

  // SINGLE handlers for currency selection - used by BOTH desktop and mobile
  const handleBuySellCurrencyChange = (currency: string) => {
    console.log("BuySell currency changed to:", currency)
    setBuySellCurrency(currency)
  }

  const handleForCurrencyChange = (currency: string) => {
    console.log("For currency changed to:", currency)
    setForCurrency(currency)
  }

  // Render currency selector based on device type
  const renderBuySellCurrencySelector = () => {
    if (isMobile) {
      return (
        <MobileCurrencySelector
          value={buySellCurrency}
          onOpen={() => setIsBuySellCurrencySheetOpen(true)}
          placeholder="Select currency"
        />
      )
    }

    return (
      <Select value={buySellCurrency} onValueChange={handleBuySellCurrencyChange}>
        <SelectTrigger className="w-full h-14 rounded-lg">
          <SelectValue placeholder="Select currency" />
        </SelectTrigger>
        <SelectContent>
          {currencies.map((currency) => (
            <SelectItem key={currency} value={currency}>
              {currency}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    )
  }

  const renderForCurrencySelector = () => {
    if (isMobile) {
      return (
        <MobileCurrencySelector
          value={forCurrency}
          onOpen={() => setIsForCurrencySheetOpen(true)}
          placeholder="Select currency"
        />
      )
    }

    return (
      <Select value={forCurrency} onValueChange={handleForCurrencyChange}>
        <SelectTrigger className="w-full h-14 rounded-lg">
          <SelectValue placeholder="Select currency" />
        </SelectTrigger>
        <SelectContent>
          {currencies.map((currency) => (
            <SelectItem key={currency} value={currency}>
              {currency}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    )
  }

  return (
    <div className="max-w-[800px] mx-auto">
      <form id="ad-details-form" onSubmit={handleSubmit} className="space-y-10">
        {!isEditMode && (
          <div>
            <h3 className="text-base font-bold leading-6 tracking-normal mb-5">Select trade type</h3>
            <TradeTypeSelector value={type} onChange={setType} isEditMode={isEditMode} />

            {/* Currency Selection - Using the same state for both desktop and mobile */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <div>
                <label className="block mb-2 text-black text-sm font-normal leading-5">
                  {type === "buy" ? "Buy currency" : "Sell currency"}
                </label>
                {renderBuySellCurrencySelector()}
              </div>

              <div>
                <label className="block mb-2 text-black text-sm font-normal leading-5">For</label>
                {renderForCurrencySelector()}
              </div>
            </div>

            {/* Debug info - remove in production */}
            <div className="mt-4 p-2 bg-gray-100 text-xs">
              Debug: BuySell={buySellCurrency}, For={forCurrency}, Mobile={isMobile.toString()}
            </div>
          </div>
        )}

        <div>
          <h3 className="text-base font-bold leading-6 tracking-normal mb-5">Set amount and rate</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <CurrencyInput
                label="Total amount"
                value={totalAmount}
                onValueChange={(value) => {
                  setTotalAmount(value)
                  setTouched((prev) => ({ ...prev, totalAmount: true }))
                }}
                onBlur={() => setTouched((prev) => ({ ...prev, totalAmount: true }))}
                placeholder="0.00"
                isEditMode={isEditMode}
                error={touched.totalAmount && !!formErrors.totalAmount}
              />
              {touched.totalAmount && formErrors.totalAmount && (
                <p className="text-destructive text-xs mt-1">{formErrors.totalAmount}</p>
              )}
            </div>

            <div>
              <RateInput
                value={fixedRate}
                onChange={(value) => {
                  setFixedRate(value)
                  setTouched((prev) => ({ ...prev, fixedRate: true }))
                }}
                onBlur={() => setTouched((prev) => ({ ...prev, fixedRate: true }))}
                error={touched.fixedRate && !!formErrors.fixedRate}
              />
              {touched.fixedRate && formErrors.fixedRate && (
                <p className="text-destructive text-xs mt-1">{formErrors.fixedRate}</p>
              )}
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-base font-bold leading-6 tracking-normal mb-5">Transaction limit</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <CurrencyInput
                label="Minimum order amount"
                value={minAmount}
                onValueChange={(value) => {
                  setMinAmount(value)
                  setTouched((prev) => ({ ...prev, minAmount: true }))
                }}
                onBlur={() => setTouched((prev) => ({ ...prev, minAmount: true }))}
                placeholder="0.00"
                error={touched.minAmount && !!formErrors.minAmount}
              />
              {touched.minAmount && formErrors.minAmount && (
                <p className="text-destructive text-xs mt-1">{formErrors.minAmount}</p>
              )}
            </div>

            <div>
              <CurrencyInput
                label="Maximum order amount"
                value={maxAmount}
                onValueChange={(value) => {
                  setMaxAmount(value)
                  setTouched((prev) => ({ ...prev, maxAmount: true }))
                }}
                onBlur={() => setTouched((prev) => ({ ...prev, maxAmount: true }))}
                placeholder="0.00"
                error={touched.maxAmount && !!formErrors.maxAmount}
              />
              {touched.maxAmount && formErrors.maxAmount && (
                <p className="text-destructive text-xs mt-1">{formErrors.maxAmount}</p>
              )}
            </div>
          </div>
        </div>
      </form>

      {/* Mobile Bottom Sheets - Using the SAME state variables and handlers */}
      <CurrencyBottomSheet
        isOpen={isBuySellCurrencySheetOpen}
        onClose={() => setIsBuySellCurrencySheetOpen(false)}
        title={type === "buy" ? "Buy currency" : "Sell currency"}
        currencies={currencies}
        selectedCurrency={buySellCurrency}
        onSelectCurrency={handleBuySellCurrencyChange}
      />

      <CurrencyBottomSheet
        isOpen={isForCurrencySheetOpen}
        onClose={() => setIsForCurrencySheetOpen(false)}
        title="For"
        currencies={currencies}
        selectedCurrency={forCurrency}
        onSelectCurrency={handleForCurrencyChange}
      />
    </div>
  )
}
