"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Textarea } from "@/components/ui/textarea"
import { Check, X, ArrowLeft } from "lucide-react"
import type { AdFormData } from "../types"
import { useIsMobile } from "@/hooks/use-mobile"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { InfoIcon } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

interface PaymentDetailsFormProps {
  onBack: () => void
  onSubmit: (data: Partial<AdFormData>, errors?: Record<string, string>) => void
  onClose: () => void
  initialData: Partial<AdFormData>
  isSubmitting?: boolean
  isEditMode?: boolean
}

export default function PaymentDetailsForm({
  onBack,
  onSubmit,
  onClose,
  initialData,
  isSubmitting = false,
  isEditMode = false,
}: PaymentDetailsFormProps) {
  const isMobile = useIsMobile()
  const [paymentMethods, setPaymentMethods] = useState<string[]>(initialData.paymentMethods || [])
  const [instructions, setInstructions] = useState(initialData.instructions || "")
  const [touched, setTouched] = useState(false)

  // Update state when initialData changes (important for edit mode)
  useEffect(() => {
    if (initialData) {
      if (initialData.paymentMethods) setPaymentMethods(initialData.paymentMethods)
      if (initialData.instructions !== undefined) setInstructions(initialData.instructions)
    }
  }, [initialData])

  // Update the component to conditionally render the payment methods section based on ad type
  // and adjust validation logic accordingly

  // First, modify the isFormValid function to not require payment methods for "sell" ads
  const isFormValid = () => {
    // If it's a sell ad, we don't need payment methods
    if (initialData.type === "sell") {
      return true
    }
    // For buy ads, we still require at least one payment method
    return paymentMethods.length > 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setTouched(true)

    // Check if form is valid
    const formValid = isFormValid()
    const errors = !formValid ? { paymentMethods: "At least one payment method is required" } : undefined

    const formData = {
      paymentMethods,
      instructions,
    }

    // If form is valid, submit; otherwise, pass errors
    if (formValid) {
      onSubmit(formData)
    } else {
      onSubmit(formData, errors)
    }
  }

  const availablePaymentMethods = ["Bank Transfer", "PayPal", "Wise", "Neteller", "Skrill"]

  const togglePaymentMethod = (method: string) => {
    setTouched(true)
    if (paymentMethods.includes(method)) {
      setPaymentMethods(paymentMethods.filter((m) => m !== method))
    } else {
      setPaymentMethods([...paymentMethods, method])
    }
  }

  // Then, update the useEffect for validation to account for the ad type
  useEffect(() => {
    const isValid = initialData.type === "sell" ? true : paymentMethods.length > 0
    // Use a custom event to communicate the form state to the parent
    const event = new CustomEvent("paymentFormValidationChange", {
      bubbles: true,
      detail: {
        isValid,
        formData: {
          paymentMethods: initialData.type === "sell" ? [] : paymentMethods,
          instructions,
        },
      },
    })
    document.dispatchEvent(event)
  }, [paymentMethods, instructions, initialData.type])

  return (
    <div className="h-full flex flex-col">
      <div className="p-6 border-b relative">
        <button onClick={onBack} className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h2 className="text-xl font-semibold text-center">
          {isEditMode ? "Edit payment details" : "Set payment details"}
        </h2>
        <button
          onClick={onClose}
          className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <form id="payment-details-form" onSubmit={handleSubmit} className="flex-1 p-6">
        <div className="max-w-[800px] mx-auto h-full flex flex-col justify-between">
          <div className="space-y-12">
            <Alert variant="info" className="bg-blue-50 border-blue-200 text-blue-900">
              <InfoIcon className="h-4 w-4 text-blue-900" />
              <AlertDescription className="flex items-center gap-2 text-sm">
                <span>
                  You're {isEditMode ? "editing" : "creating"} an ad to {initialData.type} USD{" "}
                  {initialData.totalAmount?.toFixed(2)}
                </span>
                <span>for IDR {((initialData.totalAmount || 0) * (initialData.fixedRate || 0)).toFixed(2)}</span>
              </AlertDescription>
            </Alert>

            {initialData.type === "buy" ? (
              <div>
                <h3 className="text-base font-medium mb-6">Select payment methods</h3>
                <div className="space-y-2">
                  {availablePaymentMethods.map((method) => (
                    <Card
                      key={method}
                      className={`cursor-pointer hover:border-gray-300 ${
                        paymentMethods.includes(method) ? "border-primary bg-primary/5" : ""
                      }`}
                      onClick={() => togglePaymentMethod(method)}
                    >
                      <CardContent className="p-3 flex items-center justify-between">
                        <span className="text-sm">{method}</span>
                        {paymentMethods.includes(method) && <Check className="h-4 w-4 text-primary" />}
                      </CardContent>
                    </Card>
                  ))}
                  {touched && paymentMethods.length === 0 && (
                    <p className="text-destructive text-xs mt-1">At least one payment method is required</p>
                  )}
                </div>
              </div>
            ) : null}

            <div>
              <h3 className="text-base font-medium mb-6">Instructions (Optional)</h3>
              <div>
                <Textarea
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="Enter your trade instructions"
                  className="min-h-[120px] resize-none"
                  maxLength={300}
                />
                <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                  <span>
                    This information will be visible to everyone. Don't share your phone number or personal details.
                  </span>
                  <span>{instructions.length}/300</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}

