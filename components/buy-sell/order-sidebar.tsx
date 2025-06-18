"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { X, ChevronRight, ArrowLeft, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import type { Advertisement } from "@/services/api/api-buy-sell"
import { createOrder } from "@/services/api/api-orders"
import { getUserPaymentMethods } from "@/app/profile/api/api-payment-methods"

interface OrderSidebarProps {
  isOpen: boolean
  onClose: () => void
  ad: Advertisement | null
  orderType: "buy" | "sell"
}

interface PaymentMethod {
  id: string
  type: string
  display_name: string
  fields: Record<string, any>
  is_enabled: number
  method: string
}

export default function OrderSidebar({ isOpen, onClose, ad, orderType }: OrderSidebarProps) {
  const router = useRouter()
  const [amount, setAmount] = useState(null)
  const [totalAmount, setTotalAmount] = useState(0)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [orderStatus, setOrderStatus] = useState<{ success: boolean; message: string } | null>(null)
  const [showPaymentSelection, setShowPaymentSelection] = useState(false)
  const [selectedPaymentMethods, setSelectedPaymentMethods] = useState<string[]>([])
  const [userPaymentMethods, setUserPaymentMethods] = useState<PaymentMethod[]>([])
  const [isLoadingPaymentMethods, setIsLoadingPaymentMethods] = useState(false)
  const [paymentMethodsError, setPaymentMethodsError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true)
      setOrderStatus(null)
    } else {
      // Reset animation state when closed
      setIsAnimating(false)
    }
  }, [isOpen])

  useEffect(() => {
    if (ad) {
      fetchUserPaymentMethods()
    }
  }, [ad])

  useEffect(() => {
    if (ad && amount) {
      const numAmount = Number.parseFloat(amount)
      const exchangeRate = ad.exchange_rate || 0
      const total = numAmount * exchangeRate
      setTotalAmount(total)

      // Validate amount against limits
      const minLimit = Number.parseFloat(ad.minimum_order_amount) || 0
      const maxLimit = Number.parseFloat(ad.actual_maximum_order_amount) || 0

      if (numAmount < minLimit || numAmount > maxLimit) {
        setValidationError(`Order limit: ${ad.account_currency} ${minLimit} - ${maxLimit}`)
      } else {
        setValidationError(null)
      }
    }
  }, [amount, ad])

  const fetchUserPaymentMethods = async () => {
    try {
      setIsLoadingPaymentMethods(true)
      setPaymentMethodsError(null)

      const response = await getUserPaymentMethods()

      if (response.error) {
        setPaymentMethodsError(response.error.message || "Failed to fetch payment methods")
        return
      }

      // Filter user payment methods to only show those accepted by the buyer
      const buyerAcceptedMethods = ad?.payment_methods || []
      const filteredMethods =
        response.data?.filter((method: PaymentMethod) => {
          // Check if the user's payment method matches any of the buyer's accepted methods
          return buyerAcceptedMethods.some(
            (buyerMethod: string) => method.method.toLowerCase() === buyerMethod.toLowerCase()
          )
        }) || []

      setUserPaymentMethods(filteredMethods)
    } catch (error) {
      console.error("Error fetching payment methods:", error)
      setPaymentMethodsError("Failed to load payment methods")
    } finally {
      setIsLoadingPaymentMethods(false)
    }
  }

  if (!isOpen && !isAnimating) return null

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(e.target.value)
  }

  const handleSubmit = async () => {
    if (!ad) return

    try {
      setIsSubmitting(true)
      setOrderStatus(null)

      const numAmount = Number.parseFloat(amount)

      const order = await createOrder(ad.id, numAmount, selectedPaymentMethods)
      router.push("/orders/" + order.data.id)
    } catch (error) {
      console.error("Failed to create order:", error)
      setOrderStatus({
        success: false,
        message: error instanceof Error ? error.message : "Failed to create order. Please try again.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setIsAnimating(false)
    setTimeout(() => {
      setSelectedPaymentMethods([])
      setAmount(null)
      setValidationError(null)
      setShowPaymentSelection(false)
      onClose()
    }, 300)
  }

  const handlePaymentMethodToggle = (methodId: string) => {
    setSelectedPaymentMethods((prev) =>
      prev.includes(methodId) ? prev.filter((id) => id !== methodId) : [...prev, methodId],
    )
  }

  const handleConfirmPaymentSelection = () => {
    setShowPaymentSelection(false)
  }

  const getSelectedPaymentMethodsText = () => {
    if (selectedPaymentMethods.length === 0) return "Select payment"
    if (selectedPaymentMethods.length === 1) {
      const method = userPaymentMethods.find((m) => m.id === selectedPaymentMethods[0])
      return method ? `${method.display_name}` : "Select payment"
    }
    return `Selected (${selectedPaymentMethods.length})`
  }

  const isBuy = orderType === "buy"
  const title = isBuy ? "Sell USD" : "Buy USD"
  const youSendText = isBuy ? "You receive" : "You pay"

  // Calculate order limits
  const minLimit = ad?.minimum_order_amount || "0.00"
  const maxLimit = ad?.actual_maximum_order_amount || "0.00"

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className={`fixed inset-0 bg-black/30 transition-opacity duration-300 ${isOpen && isAnimating ? "opacity-100" : "opacity-0"
          }`}
        onClick={handleClose}
      />
      <div
        className={`relative w-full max-w-md bg-white h-full overflow-y-auto transform transition-transform duration-300 ease-in-out ${isOpen && isAnimating ? "translate-x-0" : "translate-x-full"
          }`}
      >
        {ad && (
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between px-4 py-1 border-b">
              {showPaymentSelection ? (
                <>
                  <div className="flex items-center">
                    <Button onClick={() => setShowPaymentSelection(false)} variant="ghost" size="icon" className="p-1 mr-3">
                      <ArrowLeft className="h-6 w-6" />
                    </Button>
                    <h2 className="text-xl font-bold">Select payment</h2>
                  </div>
                </>
              ) : (
                <>
                  <h2 className="text-xl font-bold">{title}</h2>
                  <Button onClick={handleClose} variant="ghost" size="icon" className="p-1">
                    <X className="h-6 w-6" />
                  </Button>
                </>
              )}
            </div>

            {showPaymentSelection ? (
              <div className="flex flex-col h-full">
                <div className="flex-1 p-4 space-y-4">
                  {isLoadingPaymentMethods ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="h-8 w-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                      <span className="ml-2 text-gray-600">Loading payment methods...</span>
                    </div>
                  ) : paymentMethodsError ? (
                    <div className="text-center py-8">
                      <p className="text-red-600 mb-4">{paymentMethodsError}</p>
                      <Button onClick={fetchUserPaymentMethods} variant="outline">
                        Retry
                      </Button>
                    </div>
                  ) : userPaymentMethods.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-600 mb-4">No compatible payment methods found</p>
                      <p className="text-sm text-gray-500">
                        Add a payment method that matches the buyer's accepted methods
                      </p>
                    </div>
                  ) : (
                    userPaymentMethods.map((method) => (
                      <div
                        key={method.id}
                        className="border border-gray-200 rounded-lg p-4 bg-white cursor-pointer hover:bg-gray-50 transition-color"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center mb-2">
                              <div
                                className={`h-3 w-3 rounded-full mr-2 ${method.type === "bank" ? "bg-green-500" : "bg-blue-500"
                                  }`}
                              />
                              <span className="font-medium text-gray-600">{method.display_name}</span>
                            </div>
                          </div>
                          <Checkbox
                            checked={selectedPaymentMethods.includes(method.id)}
                            onCheckedChange={() => handlePaymentMethodToggle(method.id)}
                          />
                        </div>
                      </div>
                    ))
                  )}

                  <div className="border border-gray-200 rounded-lg p-4 bg-white cursor-pointer hover:bg-gray-50 transition-colors hidden">
                    <div className="flex items-center justify-center">
                      <Plus className="h-5 w-5 mr-2 text-gray-600" />
                      <span className="text-gray-900 font-medium">Add payment method</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 border-t">
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={handleConfirmPaymentSelection}
                    disabled={selectedPaymentMethods.length === 0}
                  >
                    Confirm
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="p-4 bg-gray-50 m-4 rounded-lg">
                  <div className="mb-2">
                    <div className="flex items-center justify-between">
                      <Input value={amount} onChange={handleAmountChange} placeholder="Enter amount" />
                      <span className="text-gray-500 hidden">{ad.account_currency}</span>
                    </div>
                  </div>
                  {validationError && <p className="text-xs text-red-500 text-sm mb-2">{validationError}</p>}
                  <div className="flex items-center">
                    <span className="text-gray-500">{youSendText}:&nbsp;</span>
                    <span className="font-bold">
                      {ad.payment_currency}{" "}
                      {Number.parseFloat(totalAmount).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                </div>

                {isBuy && (
                  <div className="mx-4 mt-4 pb-6 border-b">
                    <h3 className="text-sm text-slate-1400 mb-3">Receive payment to</h3>
                    <div
                      className="border border-gray-200 rounded-lg p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => setShowPaymentSelection(true)}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">
                          {getSelectedPaymentMethodsText()}
                        </span>
                        <ChevronRight className="h-5 w-5 text-gray-400" />
                      </div>
                    </div>
                  </div>
                )}

                <div className="mx-4 mt-4 text-sm">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-slate-500">Rate ({ad.account_currency} 1)</span>
                    <span className="text-slate-1400">
                      {ad.payment_currency} {ad.exchange_rate?.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-slate-500">Order limit</span>
                    <span className="text-slate-1400">
                      {ad.account_currency} {minLimit} - {maxLimit}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-slate-500">Payment time</span>
                    <span className="text-slate-1400">{ad.order_expiry_period} min</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-slate-500">{isBuy ? "Buyer" : "Seller"}</span>
                    <span className="text-slate-1400">{ad.user?.nickname}</span>
                  </div>
                </div>

                <div className="border-t m-4 py-2 text-sm">
                  <h3 className="text-slate-500">
                    {isBuy ? "Buyer's payment method(s)" : "Seller's payment method(s)"}
                  </h3>
                  <div className="flex flex-wrap gap-4">
                    {ad.payment_methods?.map((method, index) => (
                      <div key={index} className="flex items-center">
                        <div
                          className={`h-4 w-4 rounded-full mr-2 ${method.toLowerCase().includes("bank")
                            ? "bg-green-500"
                            : method.toLowerCase().includes("wallet") || method.toLowerCase().includes("ewallet")
                              ? "bg-blue-500"
                              : "bg-yellow-500"
                            }`}
                        />
                        <span className="text-slate-1400">
                          {method.toLowerCase().includes("bank")
                            ? "Bank transfer"
                            : method.toLowerCase().includes("wallet") || method.toLowerCase().includes("ewallet")
                              ? "eWallet"
                              : method}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mx-4 mt-4 border-t py-2 text-sm">
                  <h3 className="text-slate-500">{isBuy ? "Buyer's instructions" : "Seller's instructions"}</h3>
                  <p className="text-slate-1400 break-words">
                    {ad.description ||
                      "Kindly transfer the payment to the provided account details after placing your order."}
                  </p>
                </div>

                <div className="mt-auto p-4 border-t">
                  <Button
                    className="w-full"
                    variant="primary"
                    size="lg"
                    onClick={handleSubmit}
                    disabled={!amount || (isBuy && selectedPaymentMethods.length === 0) || !!validationError || isSubmitting}
                  >
                    {isSubmitting ? (
                      <span className="flex items-center justify-center">
                        <span className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                        Processing...
                      </span>
                    ) : (
                      "Place order"
                    )}
                  </Button>
                  {orderStatus && !orderStatus.success && (
                    <div className="mt-4 p-3 rounded-lg bg-red-50 text-red-600 text-sm">{orderStatus.message}</div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
