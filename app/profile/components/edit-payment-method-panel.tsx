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

  useEffect(() => {
    if (!paymentMethod?.details) return

    setFieldValues(
      Object.fromEntries(
        Object.entries(paymentMethod.details).map(([fieldName, fieldConfig]) => [fieldName, fieldConfig.value || ""]),
      ),
    )
  }, [paymentMethod])

  const handleInputChange = (fieldName: string, value: string) => {
    setFieldValues((prev) => ({ ...prev, [fieldName]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (isFormValid()) {
      onSave(paymentMethod.id, fieldValues)
    }
  }

  const getFieldType = (fieldName: string): string => {
    if (fieldName.includes("phone")) return "tel"
    if (fieldName.includes("email")) return "email"
    return "text"
  }

  const isFormValid = (): boolean => {
    if (!paymentMethod?.details) return false

    return Object.entries(paymentMethod.details)
      .filter(([, fieldConfig]) => fieldConfig.required)
      .every(([fieldName]) => {
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

  return (
    <PanelWrapper onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6">
          <div className="text-lg font-medium">{paymentMethod.name}</div>

          <div className="space-y-4">
            {Object.entries(paymentMethod.details).map(([fieldName, fieldConfig]) => (
              <div key={fieldName}>
                <label htmlFor={fieldName} className="block text-sm font-medium text-gray-500 mb-2">
                  {fieldConfig.display_name}
                  {fieldConfig.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                {fieldName === "instructions" ? (
                  <div>
                    <Textarea
                      id={fieldName}
                      value={fieldValues[fieldName] || ""}
                      onChange={(e) => handleInputChange(fieldName, e.target.value)}
                      placeholder={`Enter ${fieldConfig.display_name.toLowerCase()}`}
                      className="min-h-[120px] resize-none"
                      maxLength={300}
                    />
                    <div className="flex justify-end mt-1 text-xs text-gray-500">
                      {(fieldValues[fieldName] || "").length}/300
                    </div>
                  </div>
                ) : (
                  <Input
                    id={fieldName}
                    type={getFieldType(fieldName)}
                    value={fieldValues[fieldName] || ""}
                    onChange={(e) => handleInputChange(fieldName, e.target.value)}
                    placeholder={`Enter ${fieldConfig.display_name.toLowerCase()}`}
                  />
                )}
              </div>
            ))}
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
    </PanelWrapper>
  )
}
