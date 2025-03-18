"use client"

import { useState, useEffect } from "react"
import { MoreVertical } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { API, AUTH } from "@/lib/local-variables"
import { Shimmer } from "./ui/shimmer"
import { useIsMobile } from "@/lib/hooks/use-is-mobile"
import StatusModal from "@/components/ui/status-modal"
import { ProfileAPI } from "../api"

interface PaymentMethod {
  id: string
  name: string
  type: string
  category: "bank_transfer" | "e_wallet" | "other"
  details: Record<string, string>
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
    type: "success" as "success" | "error",
    title: "",
    message: "",
  })

  useEffect(() => {
    fetchPaymentMethods()
  }, [])

  const fetchPaymentMethods = async () => {
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

      console.log("✅ Successfully fetched payment methods")
      console.groupEnd()

      // Process and categorize the payment methods from the new response format
      const methods = data.data || []
      console.log("Payment Methods Data:", methods)

      // Transform the data to match our PaymentMethod interface
      const transformedMethods = methods.map((method: any) => {
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

        // Extract details from the fields object
        const details: Record<string, string> = {}
        if (method.fields) {
          Object.entries(method.fields).forEach(([key, fieldObj]: [string, any]) => {
            if (fieldObj && fieldObj.value !== undefined) {
              details[key] = fieldObj.value
            }
          })
        }

        // Format the method name for display (capitalize first letter)
        const name = methodType.charAt(0).toUpperCase() + methodType.slice(1)

        return {
          id: String(method.id || ""),
          name: name,
          type: methodType,
          category: category,
          details: details,
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

        // Show success modal
        setStatusModal({
          show: true,
          type: "success",
          title: "Payment method deleted",
          message: "Your payment method has been successfully deleted.",
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

    // For the demo, just show the account value with a * prefix
    return method.details.account ? `*${method.details.account}` : "*1234"
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
        <button onClick={fetchPaymentMethods} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded">
          Try again
        </button>
      </div>
    )
  }

  // Remove the mock data and only show API data
  // Remove these mock data blocks:
  // const mockBankTransfers = [
  //   { id: "1", name: "Bank Name", details: { account: "1234" } },
  //   { id: "2", name: "Bank Name", details: { account: "1234" } },
  //   { id: "3", name: "Bank Name", details: { account: "1234" } },
  // ]

  // const mockEWallets = [
  //   { id: "4", name: "E-Wallet Name", details: { account: "email@address" } },
  // ]

  // const mockOthers = [
  //   { id: "5", name: "Payment Name", details: { account: "details or email@address" } },
  // ]

  return (
    <div>
      {/* Bank transfer */}
      <div className="mb-8">
        <h3 className="text-xl font-bold mb-4">Bank transfer</h3>
        {bankTransfers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {bankTransfers.map((method) => (
              <div key={method.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-3">
                    {getBankIcon()}
                    <div>
                      <div className="font-medium text-lg">{method.name}</div>
                      <div className="text-gray-500">{formatAccountDetails(method as PaymentMethod)}</div>
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
                        className="flex items-center gap-2 text-red-500 focus:text-red-500"
                        onSelect={() => handleDeletePaymentMethod(method.id, method.name)}
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
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
              <div key={method.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-3">
                    {getEWalletIcon()}
                    <div>
                      <div className="font-medium text-lg">{method.name}</div>
                      <div className="text-gray-500">{method.details?.account || ""}</div>
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
                        className="flex items-center gap-2 text-red-500 focus:text-red-500"
                        onSelect={() => handleDeletePaymentMethod(method.id, method.name)}
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 italic">No e-wallets are added at the moment</p>
        )}
      </div>

      {/* Others */}
      <div>
        <h3 className="text-xl font-bold mb-4">Others</h3>
        {others.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {others.map((method) => (
              <div key={method.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-3">
                    {getOtherIcon()}
                    <div>
                      <div className="font-medium text-lg">{method.name}</div>
                      <div className="text-gray-500">{method.details?.account || ""}</div>
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
                        className="flex items-center gap-2 text-red-500 focus:text-red-500"
                        onSelect={() => handleDeletePaymentMethod(method.id, method.name)}
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 italic">No other payment methods are added at the moment</p>
        )}
      </div>
      {/* Delete Confirmation Modal */}
      {deleteConfirmModal.show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-semibold mb-4 text-center">Delete payment method?</h2>
            <p className="text-gray-600 mb-6 text-center">
              Are you sure you want to delete {deleteConfirmModal.methodName}? You will not be able to restore it.
            </p>

            <div className="space-y-3">
              <button
                onClick={confirmDeletePaymentMethod}
                disabled={isDeleting}
                className="w-full py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>

              <button
                onClick={cancelDeletePaymentMethod}
                className="w-full py-3 border border-gray-300 text-gray-700 rounded-lg font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Modal */}
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

