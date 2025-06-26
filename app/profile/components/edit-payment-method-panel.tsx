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
    details: Record<
      string,
      {
        display_name: string
        required: boolean
        value: string
      }
    >
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
    if (!paymentMethod?.details) return

    setInstructions(paymentMethod.details.instructions?.value || "")

    setFieldValues(
      Object.fromEntries(
        Object.entries(paymentMethod.details)
          .filter(([fieldName]) => fieldName !== "instructions")
          .map(([fieldName, fieldConfig]) => [fieldName, fieldConfig.value || ""]),
      ),
    )
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

  const getFieldType = (fieldName: string): string => {
    if (fieldName.includes("phone")) return "tel"
    if (fieldName.includes("email")) return "email"
    return "text"
  }

  const isFormValid = (): boolean => {
    if (!paymentMethod?.details) return false

    const requiredFields = Object.entries(paymentMethod.details)
      .filter(([fieldName, fieldConfig]) => fieldName !== "instructions" && fieldConfig.required)
      .map(([fieldName]) => fieldName)

    return requiredFields.every((fieldName) => {
      const currentValue = fieldValues[fieldName]
      return currentValue && currentValue.trim() !== ""
    })
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

  const editableFields = Object.entries(paymentMethod.details || {}).filter(
    ([fieldName]) => fieldName !== "instructions",
  )

  return (
    <PanelWrapper onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6">
          <div className="text-lg font-medium">{paymentMethod.name}</div>

          <div className="space-y-4">
            {editableFields.map(([fieldName, fieldConfig]) => (
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
            ))}
          </div>

          {paymentMethod.details?.instructions && (
            <div>
              <label htmlFor="instructions" className="block text-sm font-medium text-gray-500 mb-2">
                {paymentMethod.details.instructions.display_name}
              </label>
              <Textarea
                id="instructions"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder={`Enter ${paymentMethod.details.instructions.display_name.toLowerCase()}`}
                className="min-h-[120px] resize-none"
                maxLength={300}
              />
              <div className="flex justify-end mt-1 text-xs text-gray-500">{charCount}/300</div>
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
