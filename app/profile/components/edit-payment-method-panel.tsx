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
    name?: string
    display_name?: string
    type: string
    fields?: Record<
      string,
      {
        display_name: string
        required: boolean
        value: string
      }
    >
    details?: Record<string, any>
    instructions?: string
  }
}

interface PanelWrapperProps {
  onClose: () => void
  children: React.ReactNode
}

function PanelWrapper({ onClose, children }: PanelWrapperProps) {
  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-xl flex flex-col">
      <div className="p-6 border-b relative">
        <h2 className="text-xl font-semibold">Edit payment method</h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 h-10 w-10 rounded-full"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>
      {children}
    </div>
  )
}

export default function EditPaymentMethodPanel({
  onClose,
  onSave,
  isLoading,
  paymentMethod,
}: EditPaymentMethodPanelProps) {
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({})
  const [instructions, setInstructions] = useState("")
  const [charCount, setCharCount] = useState(0)

  useEffect(() => {
    if (!paymentMethod) return

    const initialValues: Record<string, string> = {}

    if (paymentMethod.fields) {
      Object.entries(paymentMethod.fields).forEach(([fieldName, fieldConfig]) => {
        if (fieldName === "instructions") {
          setInstructions(fieldConfig.value || "")
        } else {
          initialValues[fieldName] = fieldConfig.value || ""
        }
      })
    } else if (paymentMethod.details) {
      Object.entries(paymentMethod.details).forEach(([key, fieldData]) => {
        if (key === "instructions") return

        let extractedValue = ""

        if (fieldData && typeof fieldData === "object") {
          if ("value" in fieldData && fieldData.value) {
            const wrappedValue = fieldData.value

            if (wrappedValue && typeof wrappedValue === "object" && "value" in wrappedValue && wrappedValue.value) {
              const actualValue = wrappedValue.value
              extractedValue = String(actualValue)
            } else {
              extractedValue = String(wrappedValue)
            }
          } else {
            const nestedValue = Object.values(fieldData).find(
              (val) => val && (typeof val === "string" || typeof val === "number"),
            )
            if (nestedValue) {
              extractedValue = String(nestedValue)
            }
          }
        } else if (fieldData && typeof fieldData === "string") {
          extractedValue = fieldData
        }

        initialValues[key] = extractedValue
      })

      let instructionsValue = ""
      const instructionsField = paymentMethod.details?.instructions

      if (instructionsField) {
        if (typeof instructionsField === "object" && "value" in instructionsField && instructionsField.value) {
          instructionsValue = String(instructionsField.value)
        } else if (typeof instructionsField === "string") {
          instructionsValue = instructionsField
        }
      } else if (paymentMethod.instructions && typeof paymentMethod.instructions === "string") {
        instructionsValue = paymentMethod.instructions
      }

      setInstructions(instructionsValue)
    }

    setFieldValues(initialValues)
  }, [paymentMethod])

  useEffect(() => {
    setCharCount(instructions.length)
  }, [instructions])

  const handleInputChange = (fieldName: string, value: string) => {
    setFieldValues((prev) => ({ ...prev, [fieldName]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (isFormValid()) {
      const submissionData = { ...fieldValues }

      if (instructions.trim()) {
        submissionData.instructions = instructions.trim()
      }

      onSave(paymentMethod.id, submissionData)
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

  const isFormValid = (): boolean => {
    if (!paymentMethod) return false

    if (paymentMethod.fields) {
      const requiredFields = Object.entries(paymentMethod.fields)
        .filter(([fieldName, fieldConfig]) => fieldName !== "instructions" && fieldConfig.required)
        .map(([fieldName]) => fieldName)

      return requiredFields.every((fieldName) => {
        const currentValue = fieldValues[fieldName]
        return currentValue && currentValue.trim() !== ""
      })
    }

    return Object.keys(fieldValues).length > 0
  }

  if (!paymentMethod) {
    return (
      <PanelWrapper onClose={onClose}>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-gray-500">Loading...</div>
        </div>
      </PanelWrapper>
    )
  }

  const renderFields = () => {
    if (paymentMethod.fields) {
      const editableFields = Object.entries(paymentMethod.fields).filter(([fieldName]) => fieldName !== "instructions")

      return editableFields.map(([fieldName, fieldConfig]) => (
        <div key={fieldName}>
          <label htmlFor={fieldName} className="block text-sm font-medium text-gray-500 mb-2">
            {fieldConfig.display_name}
            {fieldConfig.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <Input
            id={fieldName}
            type={getFieldType(fieldName)}
            value={fieldValues[fieldName] || ""}
            onChange={(e) => handleInputChange(fieldName, e.target.value)}
            placeholder={`Enter ${fieldConfig.display_name.toLowerCase()}`}
          />
        </div>
      ))
    }

    return Object.entries(fieldValues).map(([fieldName, fieldValue]) => (
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
    ))
  }

  const shouldShowInstructions = () => {
    return paymentMethod.fields?.instructions || instructions
  }

  const getInstructionsLabel = () => {
    return paymentMethod.fields?.instructions?.display_name || "Instructions"
  }

  const paymentMethodName = paymentMethod.display_name || paymentMethod.name || "Payment Method"

  return (
    <PanelWrapper onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6">
          <div className="text-lg font-medium">{paymentMethodName}</div>

          <div className="space-y-4">{renderFields()}</div>

          {shouldShowInstructions() && (
            <div>
              <label htmlFor="instructions" className="block text-sm font-medium text-gray-500 mb-2">
                {getInstructionsLabel()}
              </label>
              <Textarea
                id="instructions"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder={`Enter ${getInstructionsLabel().toLowerCase()}`}
                className="min-h-[120px] resize-none"
                maxLength={300}
              />
              <div className="flex justify-end mt-1 text-xs text-gray-500">{charCount}/300</div>
            </div>
          )}

          {!paymentMethod.fields && Object.keys(fieldValues).length === 0 && (
            <div className="text-center text-gray-500 py-8">
              <p>No payment method data available</p>
              <pre className="text-xs mt-2 text-left bg-gray-100 p-2 rounded">
                {JSON.stringify(paymentMethod, null, 2)}
              </pre>
            </div>
          )}
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
    </PanelWrapper>
  )
}
