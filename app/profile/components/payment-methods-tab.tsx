"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { StatusIndicator } from "@/components/ui/status-indicator"
import { Skeleton } from "@/components/ui/skeleton"
import { Plus, Edit, Trash2 } from "lucide-react"
import { getPaymentMethods, deletePaymentMethod } from "@/app/profile/api/api-payment-methods"
import { maskAccountNumber } from "@/lib/utils"

interface PaymentMethod {
  id: string
  type: string
  display_name: string
  details: Record<string, any>
  is_enabled: boolean
}

// Get account value based on method type
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

export function PaymentMethodsTab() {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPaymentMethods = async () => {
      try {
        setLoading(true)
        const response = await getPaymentMethods()
        setPaymentMethods(response.p2p_advertiser_payment_methods?.list || [])
      } catch (err) {
        setError("Failed to load payment methods")
        console.error("Error fetching payment methods:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchPaymentMethods()
  }, [])

  const handleDelete = async (id: string) => {
    try {
      await deletePaymentMethod(id)
      setPaymentMethods((prev) => prev.filter((method) => method.id !== id))
    } catch (err) {
      console.error("Error deleting payment method:", err)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-8" />
                  <Skeleton className="h-8 w-8" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-red-600">{error}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Payment Methods</h3>
        <Button size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Add Method
        </Button>
      </div>

      {paymentMethods.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-gray-500 mb-4">No payment methods added yet</p>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Payment Method
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {paymentMethods.map((method) => {
            const accountValue = getDisplayValue(method.details, "account", method.type)

            return (
              <Card key={method.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <span className="text-blue-600 font-semibold text-sm">
                          {method.type === "bank" ? "BT" : "EW"}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-medium">{method.display_name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <StatusIndicator variant="neutral" size="sm" className="truncate">
                            {accountValue ? maskAccountNumber(accountValue) : `ID: ${method.id}`}
                          </StatusIndicator>
                          <Badge variant={method.is_enabled ? "default" : "secondary"} className="text-xs">
                            {method.is_enabled ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDelete(method.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
