"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"

interface EditPaymentMethodPanelProps {
  onClose: () => void
  onSave: (id: string, fields: Record<string, string>) => void
  isLoading: boolean
  paymentMethod: {
    id: string
    name: string
    type: string
    details: Record<string, any>
    instructions?: string
  }
}

export default function EditPaymentMethodPanel({
  onClose,
  onSave,
  isLoading,
  paymentMethod,
}: EditPaymentMethodPanelProps) {
  const [details, setDetails] = useState<Record<string, string>>({})
  const [instructions, setInstructions] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [charCount, setCharCount] = useState(0)
  const [originalDetails, setOriginalDetails] = useState<Record<string, string>>({})
  const [originalInstructions, setOriginalInstructions] = useState("")

  useEffect(() => {
    if (paymentMethod) {
      console.log("Initializing edit form with payment method:", paymentMethod)

      const formattedDetails: Record<string, string> = {
        method_type: paymentMethod.type,
      }

      // Extract values from potentially nested objects in details
      Object.entries(paymentMethod.details).forEach(([key, value]) => {
        if (key === "instructions") return

        if (value && typeof value === "object") {
          if ("value" in value) {
            formattedDetails[key] = value.value || ""
          } else if (value.value && typeof value.value === "object" && "value" in value.value) {
            formattedDetails[key] = value.value.value || ""
          } else {
            const nestedValue = Object.values(value).find((v) => typeof v === "string" || typeof v === "number")
            if (nestedValue) {
              formattedDetails[key] = String(nestedValue)
            }
          }
        } else if (typeof value === "string") {
          formattedDetails[key] = value
        }
      })

      setDetails(formattedDetails)
      setOriginalDetails(formattedDetails)

      // Set instructions
      let instructionsValue = ""
      const instructionsField = paymentMethod.details?.instructions

      if (instructionsField) {
        if (typeof instructionsField === "object") {
          if ("value" in instructionsField) {
            instructionsValue = instructionsField.value || ""
          } else if (
            instructionsField.value &&
            typeof instructionsField.value === "object" &&
            "value" in instructionsField.value
          ) {
            instructionsValue = instructionsField.value.value || ""
          }
        } else if (typeof instructionsField === "string") {
          instructionsValue = instructionsField
        }
      } else if (paymentMethod.instructions) {
        if (typeof paymentMethod.instructions === "object" && "value" in paymentMethod.instructions) {
          instructionsValue = paymentMethod.instructions.value || ""
        } else if (typeof paymentMethod.instructions === "string") {
          instructionsValue = paymentMethod.instructions
        }
      }

      setInstructions(instructionsValue)
      setOriginalInstructions(instructionsValue)

      setErrors({})
      setTouched({})

      console.log("Formatted details for form:", formattedDetails)
    }
  }, [paymentMethod])

  useEffect(() => {
    setCharCount(instructions.length)
  }, [instructions])

  const handleInputChange = (name: string, value: string) => {
    setDetails((prev) => ({ ...prev, [name]: value }))
    setTouched((prev) => ({ ...prev, [name]: true }))

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

    if (isFormValid()) {
      const fieldValues = { ...details }

      if (instructions.trim()) {
        fieldValues.instructions = instructions.trim()
      }

      console.log("Submitting field values:", fieldValues)
      onSave(paymentMethod.id, fieldValues)
    }
  }

  const getFieldLabel = (fieldName: string): string => {
    const fieldLabels: Record<string, string> = {
      account: "Account Number",
      swift_code: "SWIFT or IFSC code",
      bank_code: "SWIFT or IFSC code",
      bank_name: "Bank Name",
      branch: "Branch",
      identifier: "Email or phone number",
      phone_number: "Phone number",
    }

    return fieldLabels[fieldName] || fieldName.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
  }

  const getFieldType = (fieldName: string): string => {
    if (fieldName.includes("phone")) return "tel"
    if (fieldName.includes("email")) return "email"
    return "text"
  }

  // Simple validation: check if all originally filled fields are still filled
  const isFormValid = (): boolean => {
    // Get all fields that were originally filled (excluding system fields)
    const originallyFilledFields = Object.entries(originalDetails)
      .filter(([key, value]) => key !== "method_type" && value && value.trim())
      .map(([key]) => key)

    // Check if all originally filled fields are still filled
    const allOriginalFieldsStillFilled = originallyFilledFields.every((fieldName) => {
      const currentValue = details[fieldName]
      return currentValue && currentValue.trim()
    })

    // Check if instructions are still filled if they were originally filled
    const instructionsValid =
      originalInstructions && originalInstructions.trim() ? instructions && instructions.trim() : true

    return allOriginalFieldsStillFilled && instructionsValid
  }

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-xl flex flex-col">
      <div className="p-6 border-b relative">
        <h2 className="text-xl font-semibold">Edit payment method</h2>
        <button
          onClick={onClose}
          className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6">
          <div className="text-lg font-medium">{paymentMethod.name}</div>

          <div className="space-y-4">
            {Object.entries(details)
              .filter(([fieldName]) => fieldName !== "instructions" && fieldName !== "method_type")
              .map(([fieldName, fieldValue]) => (
                <div key={fieldName}>
                  <label htmlFor={fieldName} className="block text-sm font-medium text-gray-500 mb-2">
                    {getFieldLabel(fieldName)}
                  </label>
                  <Input
                    id={fieldName}
                    type={getFieldType(fieldName)}
                    value={fieldValue || ""}
                    onChange={(e) => handleInputChange(fieldName, e.target.value)}
                    placeholder={`Enter ${getFieldLabel(fieldName).toLowerCase()}`}
                  />
                </div>
              ))}
          </div>

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
        </div>
      </form>

      <div className="p-6 border-t">
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={isLoading || !isFormValid()}
          size="sm"
          className="w-full"
        >
          {isLoading ? "Saving..." : "Save details"}
        </Button>
      </div>
    </div>
  )
}
