"use client"

import type * as React from "react"
import { useCallback, useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import Image from "next/image"
import { usePaymentMethods } from "@/hooks/use-api-queries"
import {
  getPaymentMethodFieldMaxLength,
  getPaymentMethodFieldValidationIssue,
  isValidPaymentMethodKey,
  paymentMethodFieldNameFromKey,
  PAYMENT_METHOD_INSTRUCTIONS_MAX_LENGTH,
  requiresNumericAccountField,
  sanitizeMpesaAccountInput,
} from "@/lib/payment-method-validation"
import { getPaymentMethodFieldValidationMessageKey } from "@/lib/payment-method-field-validation-messages"
import { getPaymentMethodFields, getPaymentMethodIcon, type AvailablePaymentMethod } from "@/lib/utils"
import { PanelWrapper } from "@/components/ui/panel-wrapper"
import EmptyState from "@/components/empty-state"
import { useTranslations } from "@/lib/i18n/use-translations"

interface AddPaymentMethodPanelProps {
  onAdd: (method: string, fields: Record<string, string>) => void
  isLoading: boolean
  allowedPaymentMethods?: string[]
  onMethodSelect?: (method: string) => void
  onBack?: () => void
  selectedMethod?: string
  onClose?: () => void
}

export default function AddPaymentMethodPanel({
  onAdd,
  isLoading,
  allowedPaymentMethods,
  onMethodSelect,
  onBack,
  selectedMethod: selectedMethodProp,
  onClose,
}: AddPaymentMethodPanelProps) {
  const [selectedMethodState, setSelectedMethodState] = useState<string>("")
  const selectedMethod = selectedMethodProp || selectedMethodState
  const [showMethodDetails, setShowMethodDetails] = useState(!!selectedMethodProp)
  const [details, setDetails] = useState<Record<string, string>>({})
  const [instructions, setInstructions] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [availablePaymentMethods, setAvailablePaymentMethods] = useState<AvailablePaymentMethod[]>([])
  const [searchQuery, setSearchQuery] = useState("")

  const { t } = useTranslations()
  const { data: paymentMethods, isLoading: isLoadingMethods } = usePaymentMethods()

  useEffect(() => {
    if (paymentMethods && Array.isArray(paymentMethods)) {
      let methods = paymentMethods

      if (allowedPaymentMethods && allowedPaymentMethods.length > 0) {
        methods = methods.filter((method) =>
          allowedPaymentMethods.some((allowed) => method.method.toLowerCase() === allowed.toLowerCase()),
        )
      }

      setAvailablePaymentMethods(methods)
    }
  }, [paymentMethods, allowedPaymentMethods])

  useEffect(() => {
    setDetails({})
    setErrors({})
    setTouched({})
  }, [selectedMethod])

  useEffect(() => {
    return () => {
      setShowMethodDetails(false)
      setSelectedMethodState("")
      setDetails({})
      setErrors({})
      setTouched({})
      setInstructions("")
      setSearchQuery("")
    }
  }, [])

  const selectedMethodFields = getPaymentMethodFields(selectedMethod, availablePaymentMethods)

  const handleMethodSelect = (paymentMethod: AvailablePaymentMethod) => {
    if (onMethodSelect) {
      onMethodSelect(paymentMethod.method)
    } else {
      setSelectedMethodState(paymentMethod.method)
      setShowMethodDetails(true)
    }
  }

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchQuery(value)
  }, [])

  const handleBackToMethodList = () => {
    setShowMethodDetails(false)
    setSelectedMethodState("")
    setDetails({})
    setErrors({})
    setTouched({})
    setInstructions("")
    setSearchQuery("")
    onBack?.()
  }

  const getFieldValidationError = (method: string, fieldName: string, value: string): string | null => {
    const trimmed = value.trim()
    if (!trimmed) return null

    const field = paymentMethodFieldNameFromKey(fieldName)
    if (!field) return null

    const issue = getPaymentMethodFieldValidationIssue(method, fieldName, value)
    if (!issue) return null

    return t(getPaymentMethodFieldValidationMessageKey(field, issue))
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!selectedMethod) {
      newErrors.method = t("paymentMethod.pleaseSelectPaymentMethod")
    } else if (!isValidPaymentMethodKey(selectedMethod)) {
      newErrors.method = t("paymentMethod.pleaseSelectPaymentMethod")
    }

    selectedMethodFields.forEach((field) => {
      const value = details[field.name]?.trim() ?? ""

      if (!value && field.required) {
        newErrors[field.name] = t("profile.fieldRequired", { field: field.label })
        return
      }

      const fieldError = getFieldValidationError(selectedMethod, field.name, value)
      if (fieldError) {
        newErrors[field.name] = fieldError
      }
    })

    const instructionsError = getFieldValidationError(selectedMethod, "instructions", instructions)
    if (instructionsError) {
      newErrors.instructions = instructionsError
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (name: string, value: string) => {
    const nextValue = requiresNumericAccountField(selectedMethod, name)
      ? sanitizeMpesaAccountInput(value)
      : value

    setDetails((prev) => ({ ...prev, [name]: nextValue }))
    setTouched((prev) => ({ ...prev, [name]: true }))

    const fieldError = getFieldValidationError(selectedMethod, name, nextValue)
    if (fieldError) {
      setErrors((prev) => ({
        ...prev,
        [name]: fieldError,
      }))
      return
    }

    setErrors((prev) => {
      const newErrors = { ...prev }
      delete newErrors[name]
      return newErrors
    })
  }

  const handleInstructionsChange = (value: string) => {
    setInstructions(value)

    const fieldError = getFieldValidationError(selectedMethod, "instructions", value)
    if (fieldError) {
      setErrors((prev) => ({
        ...prev,
        instructions: fieldError,
      }))
      return
    }

    setErrors((prev) => {
      const newErrors = { ...prev }
      delete newErrors.instructions
      return newErrors
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (selectedMethodFields.length > 0) {
      const allTouched: Record<string, boolean> = {}
      selectedMethodFields.forEach((field) => {
        allTouched[field.name] = true
      })
      setTouched(allTouched)
    }

    if (validateForm()) {
      const fieldValues = { ...details }
      fieldValues.instructions = instructions.trim() || "-"

      if (selectedMethod === "bank_transfer") {
        fieldValues.bank_code = fieldValues.bank_code || "-"
        fieldValues.branch = fieldValues.branch || "-"
      }

      onAdd(selectedMethod, fieldValues)
    }
  }

  const isFormValid = () => {
    if (!selectedMethod) return false

    if (Object.keys(errors).length > 0) return false

    return selectedMethodFields.every((field) => {
      if (field.required) {
        return details[field.name]?.trim()
      }
      return true
    })
  }

  if (isLoadingMethods) {
    if (onClose) {
      return (
        <PanelWrapper onClose={onClose}>
          <div className="flex items-center justify-center py-8">
            <div className="text-gray-500">{t("paymentMethod.loadingPaymentMethods")}</div>
          </div>
        </PanelWrapper>
      )
    }
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-gray-500">{t("paymentMethod.loadingPaymentMethods")}</div>
      </div>
    )
  }

  if (availablePaymentMethods.length === 0 && !isLoadingMethods) {
    if (onClose) {
      return (
        <PanelWrapper onClose={onClose}>
          <div className="flex items-center justify-center py-8">
            <div className="text-gray-500">{t("paymentMethod.noPaymentMethodsAvailable")}</div>
          </div>
        </PanelWrapper>
      )
    }
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-gray-500">{t("paymentMethod.noPaymentMethodsAvailable")}</div>
      </div>
    )
  }

  if (!showMethodDetails && !selectedMethodProp) {
    const filteredPaymentMethods = availablePaymentMethods.filter((method) =>
      method.display_name.toLowerCase().includes(searchQuery.toLowerCase()),
    )

    const methodSelectionContent = (
      <div className="flex h-full min-h-0 w-full flex-col">
        <h2 className="shrink-0 p-4 pb-0 text-start text-2xl font-bold">
          {t("paymentMethod.selectPaymentMethod")}
        </h2>
        <div className="shrink-0 p-4 pb-2">
          <div className="relative">
            <Input
              placeholder={t("paymentMethod.search")}
              value={searchQuery}
              onChange={handleSearchChange}
              className={`text-base ps-4 h-8 md:h-14 border-grayscale-500 focus:border-black rounded-lg text-start ${searchQuery ? "pe-10" : "pe-4"}`}
              autoComplete="off"
              autoFocus
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchQuery("")}
                className="absolute end-0 top-1/2 transform -translate-y-1/2 hover:bg-transparent"
              >
                <Image src="/icons/clear-search-icon.png" alt={t("common.clearSearch")} width={24} height={24} />
              </Button>
            )}
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-4 pt-2 pb-8">
          {filteredPaymentMethods.length > 0 ? (
            <div className="space-y-3">
              {filteredPaymentMethods.map((paymentMethod) => (
                <Button
                  key={paymentMethod.method}
                  type="button"
                  variant="ghost"
                  size="lg"
                  onClick={() => handleMethodSelect(paymentMethod)}
                  className="w-full p-4 rounded-none !justify-start gap-3 h-auto border-b border-grayscale-500 hover:bg-transparent"
                >
                  <Image
                    src={getPaymentMethodIcon(paymentMethod.type) || "/placeholder.svg"}
                    alt={paymentMethod.display_name}
                    width={24}
                    height={24}
                  />
                  <span className="text-sm font-normal text-slate-1200">{paymentMethod.display_name}</span>
                </Button>
              ))}
            </div>
          ) : (
            <div className="flex h-full min-h-[160px] items-center justify-center">
              <EmptyState
                title={t("paymentMethod.paymentMethodUnavailable")}
                description={t("paymentMethod.searchDifferent")}
                redirectToAds={false}
              />
            </div>
          )}
        </div>
      </div>
    )

    if (onClose) {
      return <PanelWrapper onClose={onClose}>{methodSelectionContent}</PanelWrapper>
    }

    return <div className="flex h-full min-h-0 w-full flex-col">{methodSelectionContent}</div>
  }

  const formContent = (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex items-center gap-4 p-4 pb-0 shrink-0">
        <h2 className="text-2xl font-bold text-start">{t("paymentMethod.addPaymentDetails")}</h2>
      </div>
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto min-h-0">
        <div className="p-4 space-y-4">
          {selectedMethodFields.length > 0 && (
            <div className="space-y-4">
              {selectedMethodFields.map((field) => {
                const fieldError =
                  (touched[field.name] || details[field.name]) && errors[field.name]
                    ? errors[field.name]
                    : undefined

                return (
                <div key={field.name}>
                  <Input
                    id={field.name}
                    type={
                      requiresNumericAccountField(selectedMethod, field.name) ? "tel" : field.type
                    }
                    inputMode={
                      requiresNumericAccountField(selectedMethod, field.name) ? "numeric" : undefined
                    }
                    value={details[field.name] || ""}
                    onChange={(e) => handleInputChange(field.name, e.target.value)}
                    label={`${t("profile.enterField", { field: field.label.toLowerCase() })}`}
                    required={field.required}
                    variant="floating"
                    maxLength={getPaymentMethodFieldMaxLength(field.name)}
                    error={Boolean(fieldError)}
                  />
                  {fieldError && (
                    <p className="mt-1 text-xs text-error-text text-start">{fieldError}</p>
                  )}
                </div>
              )})}
            </div>
          )}

          <div>
            <Textarea
              id="instructions"
              value={instructions}
              onChange={(e) => handleInstructionsChange(e.target.value)}
              label={t("paymentMethod.enterInstructions")}
              className="min-h-[120px] resize-none"
              maxLength={PAYMENT_METHOD_INSTRUCTIONS_MAX_LENGTH}
              variant="floating"
              error={Boolean(errors.instructions)}
            />
            {errors.instructions && <p className="mt-1 text-xs text-error-text text-start">{errors.instructions}</p>}
            <div className="flex justify-end rtl:justify-start mt-1 text-xs text-slate-1200">
              {instructions.length}/{PAYMENT_METHOD_INSTRUCTIONS_MAX_LENGTH}
            </div>
          </div>
        </div>
      </form>

      <div className="mt-auto shrink-0 bg-white p-4 flex justify-end rtl:justify-start">
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={isLoading || !selectedMethod || !isFormValid()}
          className="w-full md:w-auto"
        >
          {isLoading ? (
            <Spinner size="xs" />
          ) : (
            t("common.add")
          )}
        </Button>
      </div>
    </div>
  )

  if (onClose) {
    return (
      <PanelWrapper onBack={!selectedMethodProp ? handleBackToMethodList : undefined} onClose={onClose}>
        {formContent}
      </PanelWrapper>
    )
  }

  return <div className="flex h-[calc(100%-60px)] w-full min-h-0 flex-col">{formContent}</div>
}
