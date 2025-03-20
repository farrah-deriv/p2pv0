"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Textarea } from "@/components/ui/textarea"
import { Check, X, ArrowLeft } from "lucide-react"
import type { AdFormData } from "@/lib/types/ad"

interface PaymentDetailsFormProps {
  onBack: () => void
  onSubmit: (data: Partial<AdFormData>) => void
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

  const isFormValid = () => {
    return paymentMethods.length > 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setTouched(true)

    if (!isFormValid()) {
      return
    }

    const formData = {
      paymentMethods,
      instructions,
    }

    onSubmit(formData)
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

  // Determine if the button should be enabled
  const buttonEnabled = paymentMethods.length > 0 && !isSubmitting

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
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-blue-900">
                <span>
                  You're {isEditMode ? "editing" : "creating"} an ad to {initialData.type} USD{" "}
                  {initialData.totalAmount?.toFixed(2)}
                </span>
                <span>for IDR {((initialData.totalAmount || 0) * (initialData.fixedRate || 0)).toFixed(2)}</span>
              </div>
            </div>

            <div>
              <h3 className="text-base font-medium mb-6">Select payment methods</h3>
              <div className="space-y-2">
                {availablePaymentMethods.map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => togglePaymentMethod(method)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded border ${
                      paymentMethods.includes(method)
                        ? "border-red-500 bg-red-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <span className="text-sm">{method}</span>
                    {paymentMethods.includes(method) && <Check className="h-4 w-4 text-red-500" />}
                  </button>
                ))}
                {touched && paymentMethods.length === 0 && (
                  <p className="text-red-500 text-xs mt-1">At least one payment method is required</p>
                )}
              </div>
            </div>

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

      {/* Fixed positioned button at bottom right */}
      <div className="fixed bottom-6 right-6">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!buttonEnabled}
          style={{
            backgroundColor: buttonEnabled ? "hsl(var(--primary))" : "#E5E7EB",
            color: buttonEnabled ? "hsl(var(--primary-foreground))" : "#9CA3AF",
            borderRadius: "9999px",
            padding: "0.625rem 2rem",
            fontSize: "0.875rem",
            fontWeight: "500",
            border: "none",
            outline: "none",
            cursor: buttonEnabled ? "pointer" : "not-allowed",
            transition: "background-color 0.2s",
            boxShadow: "none",
            position: "relative",
            zIndex: 10,
            width: "auto",
            height: "auto",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {isSubmitting ? (
            <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span>{isEditMode ? "Saving..." : "Creating..."}</span>
              <span
                style={{
                  display: "inline-block",
                  height: "1rem",
                  width: "1rem",
                  borderRadius: "50%",
                  border: "2px solid hsl(var(--primary-foreground))",
                  borderTopColor: "transparent",
                  animation: "spin 1s linear infinite",
                }}
              ></span>
            </span>
          ) : isEditMode ? (
            "Save Changes"
          ) : (
            "Create Ad"
          )}
        </button>
      </div>
    </div>
  )
}

