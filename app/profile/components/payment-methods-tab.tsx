"use client"

import { useState, useEffect, useCallback } from "react"
import { MoreVertical, Edit, Trash } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { API, AUTH } from "@/lib/local-variables"
import { Shimmer } from "./ui/shimmer"
import { useIsMobile } from "@/lib/hooks/use-is-mobile"
import StatusModal from "@/components/ui/status-modal"
import { ProfileAPI } from "../api"
import NotificationBanner from "./notification-banner"
import EditPaymentMethodPanel from "./edit-payment-method-panel"
import BankTransferEditPanel from "./bank-transfer-edit-panel"
import { DeleteConfirmationDialog } from "./delete-confirmation-dialog"
import { Card, CardContent } from "@/components/ui/card"

interface PaymentMethod {
  id: string
  name: string
  type: string
  category: "bank_transfer" | "e_wallet" | "other"
  details: Record<string, any> // Changed to any to handle nested objects
  instructions?: string
  isDefault?: boolean
}

export default function PaymentMethodsTab() {
  // Add state for delete confirmation modal and success/error modals
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const isMobile = useIsMobile()

  // Add these new state variables for modals
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

  // Add state for edit panel
  const [editPanel, setEditPanel] = useState({
    show: false,
    paymentMethod: null as PaymentMethod | null,
  })
  const [isEditing, setIsEditing] = useState(false)

  // Use useCallback to memoize the fetchPaymentMethods function
  const fetchPaymentMethods = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const url = `${API.baseUrl}/user-payment-methods`
      const headers = {
        ...AUTH.getAuthHeader(),
        "Content-Type": "application/json",
      }

      // Enhanced request logging
      console.group("📤 Payment Methods API Request")
      console.log("URL:", url)
      console.log("Headers:", headers)
      console.log("Auth Token:", AUTH.getAuthHeader().Authorization)
      console.groupEnd()

      const startTime = performance.now()
      const response = await fetch(url, {
        headers,
        // Add cache: 'no-store' to ensure we always get fresh data
        cache: "no-store",
      })
      const endTime = performance.now()

      // Enhanced response logging
      console.group("📥 Payment Methods API Response")
      console.log("Status:", response.status, response.statusText)
      console.log("Time:", `${(endTime - startTime).toFixed(2)}ms`)
      console.log("Response Headers:", Object.fromEntries([...response.headers.entries()]))

      if (!response.ok) {
        console.error("Error Response:", response.status, response.statusText)
        console.groupEnd()
        throw new Error(`Error fetching payment methods: ${response.statusText}`)
      }

      const responseText = await response.text()
      let data

      try {
        data = JSON.parse(responseText)
        console.log("Response Body (parsed):", data)
      } catch (e) {
        console.warn("⚠️ Could not parse response as JSON:", e)
        console.log("Response Body (raw):", responseText)
        data = { data: [] }
      }

      // Add this new section for detailed raw response logging
      console.log("✅ Successfully fetched payment methods")
      console.log("📋 RAW API RESPONSE:", responseText)
      console.groupEnd()

      // Process and categorize the payment methods from the new response format
      const methodsData = data.data || []
      console.log("Payment Methods Data:", methodsData)

      // Log each method individually for better debugging
      if (methodsData.length > 0) {
        console.group("🔍 Individual Payment Methods")
        methodsData.forEach((method, index) => {
          console.group(`Method ${index + 1}: ${method.method || "Unknown"} (ID: ${method.id || "N/A"})`)
          console.log("Full Method Object:", method)
          console.log("Fields:", method.fields)
          if (method.fields) {
            Object.entries(method.fields).forEach(([key, value]) => {
              console.log(`Field "${key}":`, value)
            })
          }
          console.groupEnd()
        })
        console.groupEnd()
      }

      // Transform the data to match our PaymentMethod interface
      const transformedMethods = methodsData.map((method: any) => {
        // Get the method type (e.g., "alipay", "bank_transfer")
        const methodType = method.method || ""

        // Determine the category based on the method type
        let category: "bank_transfer" | "e_wallet" | "other" = "other"

        if (["bank_transfer", "bank"].includes(methodType.toLowerCase())) {
          category = "bank_transfer"
        } else if (
          ["alipay", "google_pay", "nequi", "paypal", "skrill", "wechat_pay"].includes(methodType.toLowerCase())
        ) {
          category = "e_wallet"
        }

        // Extract instructions specifically for display
        let instructions = ""
        if (method.fields?.instructions) {
          if (typeof method.fields.instructions === "object") {
            if ("value" in method.fields.instructions) {
              instructions = method.fields.instructions.value
            } else if (
              method.fields.instructions.value &&
              typeof method.fields.instructions.value === "object" &&
              "value" in method.fields.instructions.value
            ) {
              instructions = method.fields.instructions.value.value
            }
          } else if (typeof method.fields.instructions === "string") {
            instructions = method.fields.instructions
          }
        }

        // Format the method name for display (capitalize first letter)
        const name = method.display_name || methodType.charAt(0).toUpperCase() + methodType.slice(1)

        return {
          id: String(method.id || ""),
          name: name,
          type: methodType,
          category: category,
          details: method.fields || {},
          instructions: instructions,
          isDefault: false, // Default value, update if API provides this info
        }
      })

      console.log("Transformed Payment Methods:", transformedMethods)
      setPaymentMethods(transformedMethods)
    } catch (error) {
      console.group("💥 Payment Methods API Exception")
      console.error("Error:", error)
      console.error("Stack:", error instanceof Error ? error.stack : "No stack trace available")
      console.groupEnd()

      setError(error instanceof Error ? error.message : "Failed to load payment methods")
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Fetch payment methods on mount
  useEffect(() => {
    console.log("🔄 Fetching payment methods...")
    fetchPaymentMethods()
  }, [fetchPaymentMethods])

  // Handle edit payment method
  const handleEditPaymentMethod = (method: PaymentMethod) => {
    console.log("Opening edit panel for method:", method)

    // Create a cleaned version of the payment method for editing
    const cleanedMethod = {
      ...method,
      details: { ...method.details },
    }

    setEditPanel({
      show: true,
      paymentMethod: cleanedMethod,
    })
  }

  // Handle save payment method
  const handleSavePaymentMethod = async (id: string, fields: Record<string, string>) => {
    try {
      setIsEditing(true)

      // Format fields based on payment method type
      const paymentMethod = paymentMethods.find((m) => m.id === id)
      const formattedFields: Record<string, any> = { ...fields }

      // Make sure to include method_type for the API to know which payment method type it is
      if (paymentMethod) {
        formattedFields.method_type = paymentMethod.type
      }

      console.log("Sending fields to API:", formattedFields)

      const result = await ProfileAPI.PaymentMethods.updatePaymentMethod(id, formattedFields)

      if (result.success) {
        // Show notification banner
        setNotification({
          show: true,
          message: "Payment method details updated successfully.",
        })

        // Refresh the payment methods list
        fetchPaymentMethods()
      } else {
        // Get error message based on error code
        let errorMessage = "Failed to update payment method. Please try again."

        if (result.errors && result.errors.length > 0) {
          const errorCode = result.errors[0].code

          // Map error codes to user-friendly messages
          if (errorCode === "PaymentMethodUsedByOpenOrder") {
            errorMessage = "This payment method is currently being used by an open order and cannot be modified."
          } else if (result.errors[0].message) {
            errorMessage = result.errors[0].message
          }
        }

        // Show error modal
        setStatusModal({
          show: true,
          type: "error",
          title: "Failed to update payment method",
          message: errorMessage,
        })
      }
    } catch (error) {
      console.error("Error updating payment method:", error)

      // Show error modal
      setStatusModal({
        show: true,
        type: "error",
        title: "Failed to update payment method",
        message: error instanceof Error ? error.message : "An error occurred. Please try again.",
      })
    } finally {
      // Always close the edit panel, whether successful or not
      setEditPanel({
        show: false,
        paymentMethod: null,
      })
      setIsEditing(false)
    }
  }

  // Update the handleDeletePaymentMethod function to show confirmation modal
  const handleDeletePaymentMethod = (id: string, name: string) => {
    setDeleteConfirmModal({
      show: true,
      methodId: id,
      methodName: name,
    })
  }

  // Add a function to confirm deletion
  const confirmDeletePaymentMethod = async () => {
    try {
      setIsDeleting(true)
      const result = await ProfileAPI.PaymentMethods.deletePaymentMethod(deleteConfirmModal.methodId)

      if (result.success) {
        // Close the confirmation modal
        setDeleteConfirmModal({ show: false, methodId: "", methodName: "" })

        // Show notification banner instead of success modal
        setNotification({
          show: true,
          message: "Payment method deleted.",
        })

        // Refresh the payment methods list
        fetchPaymentMethods()
      } else {
        // Show error modal
        setStatusModal({
          show: true,
          type: "error",
          title: "Failed to delete payment method",
          message: (result.errors && result.errors[0]?.message) || "An error occurred. Please try again.",
        })
      }
    } catch (error) {
      console.error("Error deleting payment method:", error)

      // Show error modal
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

  // Add a function to cancel deletion
  const cancelDeletePaymentMethod = () => {
    setDeleteConfirmModal({ show: false, methodId: "", methodName: "" })
  }

  // Add a function to close status modal
  const closeStatusModal = () => {
    setStatusModal((prev) => ({ ...prev, show: false }))
  }

  // Group payment methods by category
  const bankTransfers = paymentMethods.filter((method) => method.category === "bank_transfer")
  const eWallets = paymentMethods.filter((method) => method.category === "e_wallet")
  const others = paymentMethods.filter((method) => method.category === "other")

  // Get the appropriate icon for a payment method
  const getBankIcon = () => (
    <div className="w-10 h-10 flex items-center justify-center text-green-600">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M2 10H22V18C22 18.5304 21.7893 19.0391 21.4142 19.4142C21.0391 19.7893 20.5304 20 20 20H4C3.46957 20 2.96086 19.7893 2.58579 19.4142C2.21071 19.0391 2 18.5304 2 18V10ZM12 3L22 8H2L12 3Z"
          fill="currentColor"
        />
      </svg>
    </div>
  )

  const getEWalletIcon = () => (
    <div className="w-10 h-10 flex items-center justify-center text-blue-600">
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

  const getOtherIcon = () => (
    <div className="w-10 h-10 flex items-center justify-center text-gray-600">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 6H21V18H3V6Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M3 11H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  )

  // Format account details for display
  const formatAccountDetails = (method: PaymentMethod) => {
    if (!method || !method.details) {
      return ""
    }

    // Extract account value from the nested structure
    let accountValue = ""
    if (method.details.account) {
      if (typeof method.details.account === "object" && "value" in method.details.account) {
        accountValue = method.details.account.value
      } else if (typeof method.details.account === "string") {
        accountValue = method.details.account
      }
    }

    return accountValue ? `*${accountValue}` : "*1234"
  }

  // Add a new helper function to extract display values from nested objects
  const getDisplayValue = (field: any): string => {
    if (!field) return ""

    if (typeof field === "object") {
      if ("value" in field) {
        return field.value
      } else if (field.value && typeof field.value === "object" && "value" in field.value) {
        return field.value.value
      }
    } else if (typeof field === "string") {
      return field
    }

    return ""
  }

  // Render loading state (shimmer)
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Shimmer className="h-6 w-40" />
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <Shimmer className="h-24 w-full" />
            <Shimmer className="h-24 w-full" />
          </div>
        </div>

        <div className="space-y-2">
          <Shimmer className="h-6 w-40" />
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <Shimmer className="h-24 w-full" />
            <Shimmer className="h-24 w-full" />
            <Shimmer className="h-24 w-full" />
          </div>
        </div>
      </div>
    )
  }

  // Render error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <p className="text-red-500 mb-4">{error}</p>
        <button
          onClick={fetchPaymentMethods}
          className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded"
        >
          Try again
        </button>
      </div>
    )
  }

  return (
    <div>
      {notification.show && (
        <NotificationBanner
          message={notification.message}
          onClose={() => setNotification({ show: false, message: "" })}
        />
      )}

      {/* Bank transfer */}
      <div className="mb-8 mt-6">
        <h3 className="text-xl font-bold mb-4">Bank transfer</h3>
        {bankTransfers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {bankTransfers.map((method) => (
              <Card key={method.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-start gap-3">
                      {getBankIcon()}
                      <div>
                        <div className="font-medium text-lg">Bank Transfer</div>
                        <div className="text-gray-500">ID: {method.id}</div>
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

      {/* E-wallets */}
      <div className="mb-8">
        <h3 className="text-xl font-bold mb-4">E-wallets</h3>
        {eWallets.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {eWallets.map((method) => (
              <Card key={method.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-start gap-3">
                      {getEWalletIcon()}
                      <div>
                        <div className="font-medium text-lg">{method.name}</div>
                        <div className="text-gray-500">ID: {method.id}</div>
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

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationDialog
        open={deleteConfirmModal.show}
        title="Delete payment method?"
        description={`Are you sure you want to delete ${deleteConfirmModal.methodName}? You will not be able to restore it.`}
        isDeleting={isDeleting}
        onConfirm={confirmDeletePaymentMethod}
        onCancel={cancelDeletePaymentMethod}
      />

      {/* Edit Payment Method Panel - conditionally render based on payment method type */}
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

      {/* Error Modal - only show for errors, not for success */}
      {statusModal.show && (
        <StatusModal
          type={statusModal.type}
          title={statusModal.title}
          message={statusModal.message}
          onClose={closeStatusModal}
        />
      )}
    </div>
  )
}

