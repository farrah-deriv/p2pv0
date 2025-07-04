"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Plus, X } from "lucide-react"
import { PaymentMethodBottomSheet } from "./payment-method-bottom-sheet"
import { getUserPaymentMethods } from "@/app/profile/api/api-payment-methods"
import { getPaymentMethodIcon, getCategoryDisplayName } from "@/lib/utils"

interface PaymentMethod {
  id: number
  type: string
  method: string
  display_name: string
  fields: Record<string, any>
  is_enabled: boolean
}

interface AdPaymentMethodsProps {
  selectedMethods: number[]
  onMethodsChange: (methods: number[]) => void
}

export function AdPaymentMethods({ selectedMethods, onMethodsChange }: AdPaymentMethodsProps) {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showBottomSheet, setShowBottomSheet] = useState(false)

  const fetchPaymentMethods = async () => {
    try {
      setIsLoading(true)
      const response = await getUserPaymentMethods()
      if (response.p2p_advertiser_payment_methods?.list) {
        setPaymentMethods(response.p2p_advertiser_payment_methods.list.filter((method) => method.is_enabled))
      }
    } catch (error) {
      console.error("Error fetching payment methods:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchPaymentMethods()
  }, [])

  const getMethodDisplayDetails = (method: PaymentMethod) => {
    if (method.type === "bank") {
      const account = method.fields.account?.value || ""
      const bankName = method.fields.bank_name?.value || "Bank Transfer"
      const maskedAccount = account ? account.slice(0, 6) + "****" + account.slice(-4) : "****"

      return {
        primary: maskedAccount,
        secondary: bankName,
      }
    } else {
      const account = method.fields.account?.value || ""
      const displayValue = account || method.display_name

      return {
        primary: displayValue,
        secondary: method.display_name,
      }
    }
  }

  const handleMethodToggle = (methodId: number) => {
    if (selectedMethods.includes(methodId)) {
      onMethodsChange(selectedMethods.filter((id) => id !== methodId))
    } else {
      onMethodsChange([...selectedMethods, methodId])
    }
  }

  const handleRemoveMethod = (methodId: number) => {
    onMethodsChange(selectedMethods.filter((id) => id !== methodId))
  }

  const selectedPaymentMethods = paymentMethods.filter((method) => selectedMethods.includes(method.id))

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-20 bg-gray-200 rounded animate-pulse"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium">Payment Methods</label>
        <Button type="button" variant="outline" size="sm" onClick={() => setShowBottomSheet(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Method
        </Button>
      </div>

      {selectedPaymentMethods.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-6 text-center">
            <p className="text-gray-500 mb-2">No payment methods selected</p>
            <Button type="button" variant="outline" onClick={() => setShowBottomSheet(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Select Payment Methods
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {selectedPaymentMethods.map((method) => {
            const displayDetails = getMethodDisplayDetails(method)
            return (
              <Card key={method.id}>
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <img
                        src={getPaymentMethodIcon(method.type) || "/placeholder.svg"}
                        alt={method.display_name}
                        className="w-6 h-6"
                      />
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-sm">{displayDetails.primary}</span>
                          <Badge variant="secondary" className="text-xs">
                            {getCategoryDisplayName(method.type)}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-600">{displayDetails.secondary}</p>
                      </div>
                    </div>
                    <Button type="button" variant="ghost" size="sm" onClick={() => handleRemoveMethod(method.id)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <PaymentMethodBottomSheet
        isOpen={showBottomSheet}
        onClose={() => setShowBottomSheet(false)}
        paymentMethods={paymentMethods}
        selectedMethods={selectedMethods}
        onMethodToggle={handleMethodToggle}
      />
    </div>
  )
}
