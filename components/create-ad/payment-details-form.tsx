"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { X, ArrowLeft } from "lucide-react"
import type { AdFormData } from "@/lib/types/ad"

interface PaymentDetailsFormProps {
  onBack: () => void
  onSubmit: (data: Partial<AdFormData>) => void
  onClose: () => void
  initialData: Partial<AdFormData>
  isSubmitting?: boolean
}

export default function PaymentDetailsForm({
  onBack,
  onSubmit,
  onClose,
  initialData,
  isSubmitting = false,
}: PaymentDetailsFormProps) {
  const [paymentMethods, setPaymentMethods] = useState<string[]>(initialData.paymentMethods || [])
  const [instructions, setInstructions] = useState(initialData.instructions || "")
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  // Validate form when values change
  useEffect(() => {
    const errors: Record<string, string> = {}

    if (paymentMethods.length === 0) {
      errors.paymentMethods = "At least one payment method is required"
    }

    setFormErrors(errors)
  }, [paymentMethods])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Check for validation errors
    if (Object.keys(formErrors).length > 0) {
      console.error("Form has validation errors:", formErrors)
      return
    }

    const formData = {
      paymentMethods,
      instructions,
    }

    // Log the form data for debugging
    console.group("📝 Payment Details Form Data")
    console.log("Form Data:", formData)
    console.groupEnd()

    onSubmit(formData)
  }

  const availablePaymentMethods = ["Bank Transfer", "PayPal", "Wise", "Neteller", "Skrill"]

  const handlePaymentMethodChange = (value: string) => {
    if (value === "") {
      setPaymentMethods([])
      return
    }

    // If the value contains commas, it's multiple methods
    if (value.includes(",")) {
      const methodsArray = value.split(",").filter(Boolean)
      setPaymentMethods(methodsArray)
    } else {
      // Single method selected
      setPaymentMethods([value])
    }
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-6 border-b relative">
        <button onClick={onBack} className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h2 className="text-xl font-semibold text-center">Set payment details</h2>
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
                  You're creating an ad to {initialData.type} USD {initialData.totalAmount?.toFixed(2)}
                </span>
                <span>for IDR {((initialData.totalAmount || 0) * (initialData.fixedRate || 0)).toFixed(2)}</span>
              </div>
            </div>

            <div>
              <h3 className="text-base font-medium mb-6">Select payment method</h3>
              <div>
                <label className="text-sm text-gray-500 mb-2 block">Payment methods</label>
                <Select
                  value={paymentMethods.length > 0 ? paymentMethods[0] : ""}
                  onValueChange={handlePaymentMethodChange}
                >
                  <SelectTrigger className={`w-full h-10 ${formErrors.paymentMethods ? "border-red-500" : ""}`}>
                    <SelectValue placeholder="Select payment methods" />
                  </SelectTrigger>
                  <SelectContent>
                    {availablePaymentMethods.map((method) => (
                      <SelectItem key={method} value={method}>
                        {method}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.paymentMethods && <p className="text-red-500 text-xs mt-1">{formErrors.paymentMethods}</p>}
                {paymentMethods.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {paymentMethods.map((method) => (
                      <div key={method} className="bg-gray-100 px-2 py-1 rounded text-sm">
                        {method}
                      </div>
                    ))}
                  </div>
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
    </div>
  )
}

