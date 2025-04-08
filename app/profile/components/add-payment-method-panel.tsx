"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface AddPaymentMethodPanelProps {
  onClose: () => void
  onAdd: (method: string, fields: Record<string, string>) => void
  isLoading: boolean
}

// Define payment method types and their required fields based on the screenshots
const PAYMENT_METHODS = [
  {
    value: "bank_transfer",
    label: "Bank Transfer",
    fields: [
      { name: "account", label: "Account Number", type: "text", required: true },
      { name: "bank_code", label: "SWIFT or IFSC code", type: "text", required: false },
      { name: "bank_name", label: "Bank Name", type: "text", required: true },
      { name: "branch", label: "Branch", type: "text", required: false },
    ],
  },
  {
    value: "alipay",
    label: "Alipay",
    fields: [{ name: "alipay_id", label: "Alipay ID", type: "text" }],
  },
]

export default function AddPaymentMethodPanel({ onClose, onAdd, isLoading }: AddPaymentMethodPanelProps) {
  const [selectedMethod, setSelectedMethod] = useState<string>("")
  const [details, setDetails] = useState<Record<string, string>>({})
  const [instructions, setInstructions] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [charCount, setCharCount] = useState(0)

  // Reset details when payment method changes
  useEffect(() => {
    setDetails({})
    setErrors({})
    setTouched({})
  }, [selectedMethod])

  // Update character count for instructions
  useEffect(() => {
    setCharCount(instructions.length)
  }, [instructions])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    const method = PAYMENT_METHODS.find((m) => m.value === selectedMethod)

    if (!selectedMethod) {
      newErrors.method = "Please select a payment method"
    }

    if (method) {
      method.fields.forEach((field) => {
        if (!details[field.name]?.trim() && field.required) {
          newErrors[field.name] = `${field.label} is required`
        }
      })
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (name: string, value: string) => {
    setDetails((prev) => ({ ...prev, [name]: value }))
    setTouched((prev) => ({ ...prev, [name]: true }))

    // Clear error when user types
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Mark all fields as touched
    const method = PAYMENT_METHODS.find((m) => m.value === selectedMethod)
    if (method) {
      const allTouched: Record<string, boolean> = {}
      method.fields.forEach((field) => {
        allTouched[field.name] = true
      })
      setTouched(allTouched)
    }

    if (validateForm()) {
      // Create a fields object with all the form field values
      const fieldValues = { ...details }

      // Add instructions if present
      if (instructions.trim()) {
        fieldValues.instructions = instructions.trim()
      }

      // Pass the method value and field values to the parent component
      onAdd(selectedMethod, fieldValues)
    }
  }

  const selectedMethodConfig = PAYMENT_METHODS.find((m) => m.value === selectedMethod)

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-xl flex flex-col">
      <div className="p-6 border-b relative">
        <h2 className="text-xl font-semibold">Add payment method</h2>
        <button
          onClick={onClose}
          className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-2">Choose your payment method</label>
            <Select value={selectedMethod} onValueChange={(value) => setSelectedMethod(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map((method) => (
                  <SelectItem key={method.value} value={method.value}>
                    {method.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.method && <p className="mt-1 text-xs">{errors.method}</p>}
          </div>

          {selectedMethodConfig && (
            <div className="space-y-4">
              {selectedMethodConfig.fields.map((field) => (
                <div key={field.name}>
                  <label htmlFor={field.name} className="block text-sm font-medium text-gray-500 mb-2">
                    {field.label}
                  </label>
                  <Input
                    id={field.name}
                    type={field.type}
                    value={details[field.name] || ""}
                    onChange={(e) => handleInputChange(field.name, e.target.value)}
                    placeholder={`Enter ${field.label.toLowerCase()}`}
                  />
                  {touched[field.name] && errors[field.name] && <p className="mt-1 text-xs">{errors[field.name]}</p>}
                </div>
              ))}
            </div>
          )}

          {selectedMethod && (
            <div>
              <label htmlFor="instructions" className="block text-sm font-medium text-gray-500 mb-2">
                Instructions
              </label>
              <Textarea
                id="instructions"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Enter your instructions"
                className="min-h-[120px] resize-none"
                maxLength={300}
              />
              <div className="flex justify-end mt-1 text-xs text-gray-500">{charCount}/300</div>
            </div>
          )}
        </div>
      </form>

      <div className="p-6 border-t">
        <Button type="submit" onClick={handleSubmit} disabled={isLoading || !selectedMethod} size="sm">
          {isLoading ? "Adding..." : "Add"}
        </Button>
      </div>
    </div>
  )
}
