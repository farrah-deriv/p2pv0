"use client"

import type React from "react"
import Image from "next/image"

import { useState, useEffect, useCallback } from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { PanelWrapper } from "@/components/ui/panel-wrapper"
import { useTranslations } from "@/lib/i18n/use-translations"
import {
  getPaymentMethodFieldMaxLength,
  getPaymentMethodFieldValidationIssue,
  paymentMethodFieldNameFromKey,
  PAYMENT_METHOD_INSTRUCTIONS_MAX_LENGTH,
  requiresNumericAccountField,
  sanitizeMpesaAccountInput,
} from "@/lib/payment-method-validation"
import { getPaymentMethodFieldValidationMessageKey } from "@/lib/payment-method-field-validation-messages"

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

export default function EditPaymentMethodPanel({
  onClose,
  onSave,
  isLoading,
  paymentMethod,
}: EditPaymentMethodPanelProps) {
  const { t } = useTranslations()
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})

  const getFieldValidationError = useCallback(
    (method: string, fieldName: string, value: string): string | null => {
      const trimmed = value.trim()
      if (!trimmed) return null

      const field = paymentMethodFieldNameFromKey(fieldName)
      if (!field) return null

      const issue = getPaymentMethodFieldValidationIssue(method, fieldName, value)
      if (!issue) return null

      return t(getPaymentMethodFieldValidationMessageKey(field, issue))
    },
    [t],
  )

  useEffect(() => {
    if (!paymentMethod?.details) return

    const initialValues = Object.fromEntries(
      Object.entries(paymentMethod.details).map(([fieldName, fieldConfig]) => [fieldName, fieldConfig.value || ""]),
    )

    setFieldValues(initialValues)

    const initialErrors: Record<string, string> = {}
    Object.entries(paymentMethod.details).forEach(([fieldName, fieldConfig]) => {
      const value = initialValues[fieldName] ?? ""
      if (!value.trim() && fieldConfig.required) return

      const fieldError = getFieldValidationError(paymentMethod.type, fieldName, value)
      if (fieldError) {
        initialErrors[fieldName] = fieldError
      }
    })
    setErrors(initialErrors)
  }, [paymentMethod, getFieldValidationError])

  const handleInputChange = (fieldName: string, value: string) => {
    const nextValue = requiresNumericAccountField(paymentMethod.type, fieldName)
      ? sanitizeMpesaAccountInput(value)
      : value

    setFieldValues((prev) => ({ ...prev, [fieldName]: nextValue }))

    const fieldError = getFieldValidationError(paymentMethod.type, fieldName, nextValue)
    if (fieldError) {
      setErrors((prev) => ({
        ...prev,
        [fieldName]: fieldError,
      }))
      return
    }

    setErrors((prev) => {
      const newErrors = { ...prev }
      delete newErrors[fieldName]
      return newErrors
    })
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    Object.entries(paymentMethod.details).forEach(([fieldName, fieldConfig]) => {
      const value = fieldValues[fieldName]?.trim() ?? ""

      if (!value && fieldConfig.required) {
        newErrors[fieldName] = t("profile.fieldRequired", { field: fieldConfig.display_name })
        return
      }

      const fieldError = getFieldValidationError(paymentMethod.type, fieldName, value)
      if (fieldError) {
        newErrors[fieldName] = fieldError
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (validateForm() && isFormValid()) {
      onSave(paymentMethod.id, fieldValues)
    }
  }

  const getFieldType = (fieldName: string): string => {
    if (requiresNumericAccountField(paymentMethod.type, fieldName)) return "tel"
    if (fieldName.includes("phone")) return "tel"
    if (fieldName.includes("email")) return "email"
    return "text"
  }

  const isFormValid = (): boolean => {
    if (!paymentMethod?.details) return false

    if (Object.keys(errors).length > 0) return false

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
          <div className="text-gray-500">{t("profile.loading")}</div>
        </div>
      </PanelWrapper>
    )
  }

  return (
    <PanelWrapper onClose={onClose}>
      <div className="flex flex-col flex-1 min-h-0">
        <h2 className="shrink-0 p-4 pb-0 text-start text-2xl font-bold">{t("profile.editPaymentDetails")}</h2>
        <form onSubmit={handleSubmit} className="min-h-0 flex-1 overflow-y-auto">
          <div className="space-y-4 p-4">
            {Object.entries(paymentMethod.details).map(([fieldName, fieldConfig]) => (
              <div key={fieldName}>
                {fieldName === "instructions" ? (
                  <div>
                    <Textarea
                      id={fieldName}
                      value={fieldValues[fieldName] || ""}
                      onChange={(e) => handleInputChange(fieldName, e.target.value)}
                      label={t("profile.enterField", { field: fieldConfig.display_name.toLowerCase() })}
                      className="min-h-[120px] resize-none"
                      maxLength={PAYMENT_METHOD_INSTRUCTIONS_MAX_LENGTH}
                      variant="floating"
                      error={Boolean(errors[fieldName])}
                    />
                    {errors[fieldName] && <p className="mt-1 text-xs text-error-text text-start">{errors[fieldName]}</p>}
                    <div className="flex justify-end mt-1 text-xs text-slate-1200 rtl:justify-start">
                      {(fieldValues[fieldName] || "").length}/{PAYMENT_METHOD_INSTRUCTIONS_MAX_LENGTH}
                    </div>
                  </div>
                ) : (
                  <div>
                    <Input
                      id={fieldName}
                      type={getFieldType(fieldName)}
                      inputMode={
                        requiresNumericAccountField(paymentMethod.type, fieldName)
                          ? "numeric"
                          : undefined
                      }
                      value={fieldValues[fieldName] || ""}
                      onChange={(e) => handleInputChange(fieldName, e.target.value)}
                      label={t("profile.enterField", { field: fieldConfig.display_name.toLowerCase() })}
                      required={fieldConfig.required}
                      variant="floating"
                      maxLength={getPaymentMethodFieldMaxLength(fieldName)}
                      error={Boolean(errors[fieldName])}
                    />
                    {errors[fieldName] && <p className="mt-1 text-xs text-error-text text-start">{errors[fieldName]}</p>}
                  </div>
                )}
              </div>
            ))}
          </div>
        </form>

        <div className="mt-auto flex shrink-0 justify-end bg-white p-4 rtl:justify-start">
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading || !isFormValid()}
            className="w-full md:w-auto"
          >
            {isLoading ? (
              <Image src="/icons/spinner.png" alt={t("common.loading")} width={20} height={20} className="animate-spin" />
            ) : (
              t("profile.saveChanges")
            )}
          </Button>
        </div>
      </div>
    </PanelWrapper>
  )
}
