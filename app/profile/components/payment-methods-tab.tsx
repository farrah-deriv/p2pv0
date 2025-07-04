"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trash2, Edit, Plus } from "lucide-react"
import { AddPaymentMethodModal } from "./add-payment-method-modal"
import { EditPaymentMethodPanel } from "./edit-payment-method-panel"
import { DeleteConfirmationDialog } from "./delete-confirmation-dialog"
import { getUserPaymentMethods, deletePaymentMethod } from "../api"
import { maskAccountNumber, getPaymentMethodIcon, getCategoryDisplayName } from "@/lib/utils"

interface PaymentMethod {
  id: number
  type: string
  method: string
  display_name: string
  fields: Record<string, any>
  is_enabled: boolean
}

export function PaymentMethodsTab() {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null)
  const [deletingMethod, setDeletingMethod] = useState<PaymentMethod | null>(null)

  const fetchPaymentMethods = async () => {
    try {
      setIsLoading(true)
      const response = await getUserPaymentMethods()
      if (response.p2p_advertiser_payment_methods?.list) {
        setPaymentMethods(response.p2p_advertiser_payment_methods.list)
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

  const handleDelete = async (method: PaymentMethod) => {
    try {
      await deletePaymentMethod(method.id)
      await fetchPaymentMethods()
      setDeletingMethod(null)
    } catch (error) {
      console.error("Error deleting payment method:", error)
    }
  }

  const getAccountInfo = (method: PaymentMethod) => {
    const accountField = method.fields.account
    if (accountField) {
      return maskAccountNumber(accountField)
    }
    return "No account info"
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Payment Methods</h3>
        <Button onClick={() => setShowAddModal(true)} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Add Method
        </Button>
      </div>

      {paymentMethods.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-gray-500 mb-4">No payment methods added yet</p>
            <Button onClick={() => setShowAddModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Payment Method
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {paymentMethods.map((method) => (
            <Card key={method.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <img
                      src={getPaymentMethodIcon(method.type) || "/placeholder.svg"}
                      alt={method.display_name}
                      className="w-8 h-8"
                    />
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{method.display_name}</span>
                        <Badge variant={method.is_enabled ? "default" : "secondary"}>
                          {method.is_enabled ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">
                        {getCategoryDisplayName(method.type)} • {getAccountInfo(method)}
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" onClick={() => setEditingMethod(method)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setDeletingMethod(method)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AddPaymentMethodModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={fetchPaymentMethods}
      />

      {editingMethod && (
        <EditPaymentMethodPanel
          method={editingMethod}
          onClose={() => setEditingMethod(null)}
          onSuccess={fetchPaymentMethods}
        />
      )}

      {deletingMethod && (
        <DeleteConfirmationDialog
          isOpen={true}
          onClose={() => setDeletingMethod(null)}
          onConfirm={() => handleDelete(deletingMethod)}
          title="Delete Payment Method"
          description={`Are you sure you want to delete ${deletingMethod.display_name}? This action cannot be undone.`}
        />
      )}
    </div>
  )
}
