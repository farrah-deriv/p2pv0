"use client"

import { Button } from "@/components/ui/button"

import { useState, useEffect, useCallback } from "react"
import { MoreVertical, Edit, Trash } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { API, AUTH } from "@/lib/local-variables"
import { CustomShimmer } from "./ui/custom-shimmer"
import CustomStatusModal from "./ui/custom-status-modal"
import { ProfileAPI } from "../api"
import CustomNotificationBanner from "./ui/custom-notification-banner"
import EditPaymentMethodPanel from "./edit-payment-method-panel"
import BankTransferEditPanel from "./bank-transfer-edit-panel"
import { DeleteConfirmationDialog } from "./delete-confirmation-dialog"
import { Card, CardContent } from "@/components/ui/card"
import { StatusIndicator } from "@/components/ui/status-indicator"

// Utility function to mask account numbers for bank transfers
const maskAccountNumber = (accountNumber: string): string => {
  if (!accountNumber || accountNumber.length <= 4) {
    return accountNumber
  }
  const lastFour = accountNumber.slice(-4)
  const maskedPart = "*".repeat(accountNumber.length - 4)
  return maskedPart + lastFour
}

interface PaymentMethod {
  id: string
  name: string
  type: string
  category: "bank_transfer" | "e_wallet" | "other"
  details: Record<string, any>
  instructions?: string
  isDefault?: boolean
}

export default function PaymentMethodsTab() {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [deleteConfirmModal, setDeleteConfirmModal] = useState({
    show: false,
    methodId: "",
    methodName: "",
  })
  const [isDeleting, setIsDeleting] = useState(false)
  const [statusModal, setStatusModal] = useState({
    show: false,
    type: "error" as "success" | "error",
    title: "",
    message: "",
  })
  const [notification, setNotification] = useState<{ show: boolean; message: string }>({
    show: false,
    message: "",
  })

  const [editPanel, setEditPanel] = useState({
    show: false,
    paymentMethod: null as PaymentMethod | null,
  })
  const [isEditing, setIsEditing] = useState(false)

  const fetchPaymentMethods = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const url = `${API.baseUrl}/user-payment-methods`
      const headers = {
        ...AUTH.getAuthHeader(),
        "Content-Type": "application/json",
        "X-Data-Source": "live",
      }
      const response = await fetch(url, {
        headers,
        cache: "no-store",
      })

      if (!response.ok) {
        throw new Error(`Error fetching payment methods: ${response.statusText}`)
      }

      const responseText = await response.text()
      let data

      try {
        data = JSON.parse(responseText)
      } catch (e) {
        data = { data: [] }
      }

      const methodsData = data.data || []

      const transformedMethods = methodsData.map((method: any) => {
        const methodType = method.method || ""

        let category: "bank_transfer" | "e_wallet" | "other" = "other"

        if (method.type === "bank") {
          category = "bank_transfer"
        } else if (method.type === "ewallet") {
          category = "e_wallet"
        }

        let instructions = ""
        if (method.fields?.instructions?.value) {
          instructions = method.fields.instructions.value
        }

        const name = method.display_name || methodType.charAt(0).toUpperCase() + methodType.slice(1)

        return {
          id: String(method.id || ""),
          name: name,
          type: methodType,
          category: category,
          details: method.fields || {},
          instructions: instructions,
          isDefault: false,
        }
      })

      setPaymentMethods(transformedMethods)
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to load payment methods")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPaymentMethods()
  }, [fetchPaymentMethods])

  const handleEditPaymentMethod = (method: PaymentMethod) => {
    const cleanedMethod = {
      ...method,
      details: { ...method.details },
    }

    setEditPanel({
      show: true,
      paymentMethod: cleanedMethod,
    })
  }

  const handleSavePaymentMethod = async (id: string, fields: Record<string, string>) => {
    try {
      setIsEditing(true)

      const paymentMethod = paymentMethods.find((m) => m.id === id)
      const formattedFields: Record<string, any> = { ...fields }

      if (paymentMethod) {
        formattedFields.method_type = paymentMethod.type
      }

      const result = await ProfileAPI.PaymentMethods.updatePaymentMethod(id, formattedFields)

      if (result.success) {
        setNotification({
          show: true,
          message: "Payment method details updated successfully.",
        })

        fetchPaymentMethods()
      } else {
        let errorMessage = "Failed to update payment method. Please try again."

        if (result.errors && result.errors.length > 0) {
          const errorCode = result.errors[0].code

          if (errorCode === "PaymentMethodUsedByOpenOrder") {
            errorMessage = "This payment method is currently being used by an open order and cannot be modified."
          } else if (result.errors[0].message) {
            errorMessage = result.errors[0].message
          }
        }

        setStatusModal({
          show: true,
          type: "error",
          title: "Failed to update payment method",
          message: errorMessage,
        })
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "An error occurred. Please try again.")

      setStatusModal({
        show: true,
        type: "error",
        title: "Failed to update payment method",
        message: error instanceof Error ? error.message : "An error occurred. Please try again.",
      })
    } finally {
      setEditPanel({
        show: false,
        paymentMethod: null,
      })
      setIsEditing(false)
    }
  }

  const handleDeletePaymentMethod = (id: string, name: string) => {
    setDeleteConfirmModal({
      show: true,
      methodId: id,
      methodName: name,
    })
  }

  const confirmDeletePaymentMethod = async () => {
    try {
      setIsDeleting(true)
      const result = await ProfileAPI.PaymentMethods.deletePaymentMethod(deleteConfirmModal.methodId)

      if (result.success) {
        setDeleteConfirmModal({ show: false, methodId: "", methodName: "" })

        setNotification({
          show: true,
          message: "Payment method deleted.",
        })

        fetchPaymentMethods()
      } else {
        setStatusModal({
          show: true,
          type: "error",
          title: "Failed to delete payment method",
          message: (result.errors && result.errors[0]?.message) || "An error occurred. Please try again.",
        })
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "An error occurred. Please try again.")

      setStatusModal({
        show: true,
        type: "error",
        title: "Failed to delete payment method",
        message: error instanceof Error ? error.message : "An error occurred. Please try again.",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const cancelDeletePaymentMethod = () => {
    setDeleteConfirmModal({ show: false, methodId: "", methodName: "" })
  }

  const closeStatusModal = () => {
    setStatusModal((prev) => ({ ...prev, show: false }))
  }

  const bankTransfers = paymentMethods.filter((method) => method.category === "bank_transfer")
  const eWallets = paymentMethods.filter((method) => method.category === "e_wallet")

  const getBankIcon = () => (
    <div className="w-10 h-10 flex items-center justify-center text-success">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M2 10H22V18C22 18.5304 21.7893 19.0391 21.4142 19.4142C21.0391 19.7893 20.5304 20 20 20H4C3.46957 20 2.96086 19.7893 2.58579 19.4142C2.21071 19.0391 2 18.5304 2 18V10ZM12 3L22 8H2L12 3Z"
          fill="currentColor"
        />
      </svg>
    </div>
  )

  const getEWalletIcon = () => (
    <div className="w-10 h-10 flex items-center justify-center text-blue">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M19 6H5C3.89543 6 3 6.89543 3 8V16C3 17.1046 3.89543 18 5 18H19C20.1046 18 21 17.1046 21 16V8C21 6.89543 20.1046 6 19 6Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M16 13C16.5523 13 17 12.5523 17 12C17 11.4477 16.5523 11 16 11C15.4477 11 15 11.4477 15 12C15 12.5523 15.4477 13 16 13Z"
          fill="currentColor"
        />
      </svg>
    </div>
  )

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <CustomShimmer className="h-6 w-40" />
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <CustomShimmer className="h-24 w-full" />
            <CustomShimmer className="h-24 w-full" />
          </div>
        </div>

        <div className="space-y-2">
          <CustomShimmer className="h-6 w-40" />
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <CustomShimmer className="h-24 w-full" />
            <CustomShimmer className="h-24 w-full" />
            <CustomShimmer className="h-24 w-full" />
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <p className="text-red-500 mb-4">{error}</p>
        <Button
          onClick={fetchPaymentMethods}
          variant="primary"
          className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded"
        >
          Try again
        </Button>
      </div>
    )
  }

  return (
    <div>
      {notification.show && (
        <CustomNotificationBanner
          message={notification.message}
          onClose={() => setNotification({ show: false, message: "" })}
        />
      )}

      <div className="mb-8 mt-6">
        <h3 className="text-xl font-bold mb-4">Bank transfer</h3>
        {bankTransfers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {bankTransfers.map((method) => (
              <Card key={method.id} variant="default" className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-start gap-3">
                      {getBankIcon()}
                      <div>
                        <div className="font-medium text-lg">Bank Transfer</div>
                        <StatusIndicator variant="neutral" size="sm">
                          {method.details?.account?.value
                            ? maskAccountNumber(method.details.account.value)
                            : `ID: ${method.id}`}
                        </StatusIndicator>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-1 hover:bg-gray-100 rounded-full">
                          <MoreVertical className="h-5 w-5 text-gray-500" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-[160px]">
                        <DropdownMenuItem
                          className="flex items-center gap-2 text-gray-700 focus:text-gray-700"
                          onSelect={() => handleEditPaymentMethod(method)}
                        >
                          <Edit className="h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="flex items-center gap-2 text-destructive focus:text-destructive"
                          onSelect={() => handleDeletePaymentMethod(method.id, method.name)}
                        >
                          <Trash className="h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 italic">No bank transfers are added at the moment</p>
        )}
      </div>

      <div className="mb-8">
        <h3 className="text-xl font-bold mb-4">E-wallets</h3>
        {eWallets.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {eWallets.map((method) => (
              <Card key={method.id} variant="default" className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-start gap-3">
                      {getEWalletIcon()}
                      <div>
                        <div className="font-medium text-lg">{method.name}</div>
                        <StatusIndicator variant="neutral" size="sm">
                          {method.details?.account?.value || `ID: ${method.id}`}
                        </StatusIndicator>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-1 hover:bg-gray-100 rounded-full">
                          <MoreVertical className="h-5 w-5 text-gray-500" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-[160px]">
                        <DropdownMenuItem
                          className="flex items-center gap-2 text-gray-700 focus:text-gray-700"
                          onSelect={() => handleEditPaymentMethod(method)}
                        >
                          <Edit className="h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="flex items-center gap-2 text-destructive focus:text-destructive"
                          onSelect={() => handleDeletePaymentMethod(method.id, method.name)}
                        >
                          <Trash className="h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 italic">No e-wallets are added at the moment</p>
        )}
      </div>

      <DeleteConfirmationDialog
        open={deleteConfirmModal.show}
        title="Delete payment method?"
        description={`Are you sure you want to delete ${deleteConfirmModal.methodName}? You will not be able to restore it.`}
        isDeleting={isDeleting}
        onConfirm={confirmDeletePaymentMethod}
        onCancel={cancelDeletePaymentMethod}
      />

      {editPanel.show &&
        editPanel.paymentMethod &&
        (editPanel.paymentMethod.type === "bank_transfer" ? (
          <BankTransferEditPanel
            paymentMethod={editPanel.paymentMethod}
            onClose={() => setEditPanel({ show: false, paymentMethod: null })}
            onSave={handleSavePaymentMethod}
            isLoading={isEditing}
          />
        ) : (
          <EditPaymentMethodPanel
            paymentMethod={editPanel.paymentMethod}
            onClose={() => setEditPanel({ show: false, paymentMethod: null })}
            onSave={handleSavePaymentMethod}
            isLoading={isEditing}
          />
        ))}

      {statusModal.show && (
        <CustomStatusModal
          type={statusModal.type}
          title={statusModal.title}
          message={statusModal.message}
          onClose={closeStatusModal}
        />
      )}
    </div>
  )
}
