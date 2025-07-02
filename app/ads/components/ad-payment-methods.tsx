"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Check, Plus } from "lucide-react"
import { getUserPaymentMethods } from "@/app/profile/api/api-payment-methods"
import { formatPaymentMethodName, maskAccountNumber } from "@/lib/utils"
import { StatusIndicator } from "@/components/ui/status-indicator"
import AddPaymentMethodPanel from "@/app/profile/components/add-payment-method-panel"
import { addPaymentMethod } from "@/app/profile/api/api-payment-methods"

interface PaymentMethod {
  id: string
  name: string
  type: string
  details: Record<string, any>
  instructions?: string
  isDefault?: boolean
}

export default function AdPaymentMethods() {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [selectedMethods, setSelectedMethods] = useState<number[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddPanel, setShowAddPanel] = useState(false)
  const [isAddingMethod, setIsAddingMethod] = useState(false)

  const MAX_SELECTIONS = 3

  useEffect(() => {
    fetchPaymentMethods()
  }, [])

  useEffect(() => {
    if (typeof window !== "undefined") {
      ;(window as any).adPaymentMethodIds = selectedMethods
    }
  }, [selectedMethods])

  const fetchPaymentMethods = async () => {
    try {
      setIsLoading(true)
      const methods = await getUserPaymentMethods()
      setPaymentMethods(Array.isArray(methods) ? methods : [])
    } catch (error) {
      console.error("Error fetching payment methods:", error)
      setPaymentMethods([])
    } finally {
      setIsLoading(false)
    }
  }

  const toggleMethod = (methodId: string) => {
    const id = Number(methodId)
    setSelectedMethods((prev) => {
      const isSelected = prev.includes(id)
      if (isSelected) {
        return prev.filter((selectedId) => selectedId !== id)
      } else if (prev.length < MAX_SELECTIONS) {
        return [...prev, id]
      }
      return prev
    })
  }

  const isMethodSelected = (methodId: string) => {
    return selectedMethods.includes(Number(methodId))
  }

  const isMaxReached = selectedMethods.length >= MAX_SELECTIONS

  const getDisplayValue = (details: Record<string, any>, fieldKey: string, methodType: string): string => {
    const field = details?.[fieldKey]
    if (!field?.value) return ""

    switch (methodType) {
      case "ewallet":
        // E-wallets: direct string value
        return field.value || ""
      case "bank":
        // Bank transfers: nested object with value property
        return field.value?.value || ""
      default:
        // Fallback for unknown types
        return typeof field.value === "string" ? field.value : field.value?.value || ""
    }
  }

  const handleAddPaymentMethod = async (method: string, fields: Record<string, string>) => {
    try {
      setIsAddingMethod(true)
      const result = await addPaymentMethod(method, fields)

      if (result.success) {
        // Refresh payment methods list
        await fetchPaymentMethods()
        setShowAddPanel(false)
      } else {
        console.error("Failed to add payment method:", result.errors)
      }
    } catch (error) {
      console.error("Error adding payment method:", error)
    } finally {
      setIsAddingMethod(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h3 className="text-base font-bold leading-6 tracking-normal">Select payment methods</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-4">
        <h3 className="text-base font-bold leading-6 tracking-normal">Select payment methods</h3>

        {paymentMethods.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">No payment methods found. Add one to continue.</p>
            <Button onClick={() => setShowAddPanel(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Payment Method
            </Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {paymentMethods.map((method) => {
                const isSelected = isMethodSelected(method.id)
                const isDisabled = !isSelected && isMaxReached
                const accountValue = getDisplayValue(method.details, "account", method.type)

                return (
                  <Card
                    key={method.id}
                    className={`cursor-pointer transition-all duration-200 ${
                      isSelected
                        ? "border-[#00D2FF] bg-[#00D2FF]/5"
                        : isDisabled
                          ? "opacity-50 cursor-not-allowed"
                          : "hover:border-gray-300"
                    }`}
                    onClick={() => !isDisabled && toggleMethod(method.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium text-sm truncate">{formatPaymentMethodName(method.name)}</h4>
                            {isSelected && (
                              <div className="w-5 h-5 flex items-center justify-center rounded-full bg-[#00D2FF] flex-shrink-0">
                                <Check className="h-3 w-3 text-white" />
                              </div>
                            )}
                          </div>
                          <StatusIndicator variant="neutral" size="sm" className="truncate">
                            {accountValue ? maskAccountNumber(accountValue) : `ID: ${method.id}`}
                          </StatusIndicator>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}

              {/* Add Payment Method Button */}
              <Card
                className="cursor-pointer transition-all duration-200 hover:border-gray-300 border-dashed"
                onClick={() => setShowAddPanel(true)}
              >
                <CardContent className="p-4 h-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-gray-100 flex items-center justify-center">
                      <Plus className="h-6 w-6 text-gray-400" />
                    </div>
                    <p className="text-sm font-medium text-gray-600">Add Payment Method</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {isMaxReached && (
              <p className="text-amber-600 text-xs">Maximum of {MAX_SELECTIONS} payment methods can be selected</p>
            )}

            {selectedMethods.length === 0 && (
              <p className="text-destructive text-xs">At least one payment method must be selected</p>
            )}
          </>
        )}
      </div>

      {/* Add Payment Method Panel */}
      {showAddPanel && (
        <AddPaymentMethodPanel
          onClose={() => setShowAddPanel(false)}
          onAdd={handleAddPaymentMethod}
          isLoading={isAddingMethod}
        />
      )}
    </>
  )
}
