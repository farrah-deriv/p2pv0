"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { StandaloneCheckRegularIcon } from "@deriv/quill-icons/Standalone"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useTranslations } from "@/lib/i18n/use-translations"

interface PaymentMethod {
  display_name: string
  method: string
  type: string
  fields: Record<string, any>
}

interface PaymentMethodBottomSheetProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (methods: string[]) => void
  selectedMethods: string[]
  availableMethods: PaymentMethod[]
  maxSelections: number
}

export default function PaymentMethodBottomSheet({
  isOpen,
  onClose,
  onSelect,
  selectedMethods,
  availableMethods,
  maxSelections = 3,
}: PaymentMethodBottomSheetProps) {
  const { t } = useTranslations()
  const [localSelectedMethods, setLocalSelectedMethods] = useState<string[]>(selectedMethods)
  const [initialSelectedMethods, setInitialSelectedMethods] = useState<string[]>(selectedMethods)
  const [searchQuery, setSearchQuery] = useState("")
  const [startY, setStartY] = useState(0)
  const [currentY, setCurrentY] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const bottomSheetRef = useRef<HTMLDivElement>(null)

  const convertToSnakeCase = (str: string): string => {
    return str
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/[^a-z0-9_]/g, "")
  }

  const isDisplayName = (value: string): boolean => {
    return value.includes(" ") || /[A-Z]/.test(value)
  }

  const normalizeMethodName = (methodName: string): string => {
    return isDisplayName(methodName) ? convertToSnakeCase(methodName) : methodName
  }

  const filteredMethods = availableMethods.filter((method) =>
    method.display_name.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  useEffect(() => {
    if (isOpen) {
      setLocalSelectedMethods(selectedMethods)
      setInitialSelectedMethods(selectedMethods)
      setSearchQuery("")
    }
  }, [isOpen, selectedMethods])

  const toggleMethod = (method: PaymentMethod, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const methodName = method.method
    const normalizedSelected = localSelectedMethods.map(normalizeMethodName)

    if (normalizedSelected.includes(methodName)) {
      setLocalSelectedMethods(localSelectedMethods.filter((m) => normalizeMethodName(m) !== methodName))
    } else if (localSelectedMethods.length < maxSelections) {
      setLocalSelectedMethods([...localSelectedMethods, methodName])
    }
  }

  const isMethodSelected = (method: PaymentMethod) => {
    const normalizedSelected = localSelectedMethods.map(normalizeMethodName)
    return normalizedSelected.includes(method.method)
  }

  const isMaxReached = localSelectedMethods.length >= maxSelections

  const handleSelect = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onSelect(localSelectedMethods)
    onClose()
  }

  const handleReset = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setLocalSelectedMethods(initialSelectedMethods)
  }

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      e.preventDefault()
      e.stopPropagation()
      onClose()
    }
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    setStartY(e.touches[0].clientY)
    setIsDragging(true)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging) {
      setCurrentY(e.touches[0].clientY)
    }
  }

  const handleTouchEnd = () => {
    if (isDragging) {
      if (currentY - startY > 100) {
        onClose()
      }
      setIsDragging(false)
    }
  }

  const getTransformStyle = () => {
    if (isDragging && currentY > startY) {
      return { transform: `translateY(${currentY - startY}px)` }
    }
    return {}
  }

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 bg-black bg-opacity-50"
      onClick={handleOverlayClick}
      onMouseDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
    >
      <div
        ref={bottomSheetRef}
        className="fixed bottom-0 left-0 right-0 bg-white rounded-t-xl max-h-[90vh] overflow-y-auto z-[60]"
        style={getTransformStyle()}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => {
          e.stopPropagation()
          handleTouchStart(e)
        }}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Drag handle */}
        <div className="w-full flex justify-center pt-2 pb-4">
          <div className="w-12 h-1 bg-gray-300 rounded-full"></div>
        </div>

        <form onSubmit={handleFormSubmit} className="px-6 pb-8">
          <h2 className="text-2xl font-bold text-center mb-2">{t("paymentMethod.paymentMethodsSheetTitle")}</h2>
          <p className="text-center text-gray-600 mb-6">{t("paymentMethod.selectPaymentMethodsHint")}</p>

          {/* Search input — no leading icon when empty (mobile parity) */}
          <div className="relative mb-6">
            <Input
              type="text"
              placeholder={t("paymentMethod.search")}
              variant="tertiary"
              value={searchQuery}
              onChange={(e) => {
                e.stopPropagation()
                setSearchQuery(e.target.value)
              }}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div className="space-y-4 mb-8 h-[300px] overflow-y-auto">
            {filteredMethods.length > 0 ? (
              filteredMethods.map((method) => (
                <Button
                  key={method.method}
                  type="button"
                  variant="ghost"
                  className="w-full flex items-center gap-3 !py-3 !h-auto !rounded-none !justify-start"
                  onClick={(e) => toggleMethod(method, e)}
                  onMouseDown={(e) => e.stopPropagation()}
                  disabled={!isMethodSelected(method) && isMaxReached}
                >
                  <div
                    className={`w-6 h-6 flex items-center justify-center rounded-md border ${
                      isMethodSelected(method)
                        ? "bg-black border-black text-white"
                        : isMaxReached
                          ? "border-gray-200 bg-gray-100"
                          : "border-gray-200"
                    }`}
                  >
                    {isMethodSelected(method) && <StandaloneCheckRegularIcon iconSize="sm" />}
                  </div>
                  <span className={isMaxReached && !isMethodSelected(method) ? "text-gray-400" : "text-gray-900"}>
                    {method.display_name}
                  </span>
                </Button>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-[200px] text-center">
                <h3 className="text-lg font-medium mb-1">{t("paymentMethod.noPaymentMethodsFound")}</h3>
                <p className="text-gray-500 max-w-xs">{t("paymentMethod.methodNotAvailableSearch")}</p>
              </div>
            )}
          </div>
          <div className="space-y-3">
            <Button
              type="button"
              onClick={handleSelect}
              onMouseDown={(e) => e.stopPropagation()}
              className="w-full"
            >
              {t("wallet.select")}
            </Button>
            <Button
              type="button"
              onClick={handleReset}
              onMouseDown={(e) => e.stopPropagation()}
              variant="outline"
              className="w-full h-[48px] border-black rounded-full"
            >
              {t("paymentMethod.reset")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
