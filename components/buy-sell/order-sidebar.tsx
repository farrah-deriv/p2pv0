"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { X, Building, CreditCard, Check, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { Advertisement } from "@/services/api/api-buy-sell"
import { createOrder } from "@/services/api/api-orders"

interface OrderSidebarProps {
  isOpen: boolean
  onClose: () => void
  ad: Advertisement | null
  orderType: "buy" | "sell"
}

export default function OrderSidebar({ isOpen, onClose, ad, orderType }: OrderSidebarProps) {
  const router = useRouter()
  const [amount, setAmount] = useState("")
  const [totalAmount, setTotalAmount] = useState("0")
  const [validationError, setValidationError] = useState<string | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [orderStatus, setOrderStatus] = useState<{ success: boolean; message: string } | null>(null)

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true)
    } else {
      // Reset animation state when closed
      setIsAnimating(false)
    }
  }, [isOpen])

  useEffect(() => {
    if (ad && ad.minimum_order_amount) {
      setAmount(ad.minimum_order_amount.toFixed(2))
    }
  }, [ad])

  useEffect(() => {
    if (ad && amount) {
      const numAmount = Number.parseFloat(amount)
      const exchangeRate = ad.exchange_rate || 0
      const total = (numAmount * exchangeRate).toFixed(2)
      setTotalAmount(total)

      // Validate amount against limits
      const minLimit = ad.minimum_order_amount || 0
      const maxLimit = ad.actual_maximum_order_amount || 0

      if (numAmount < minLimit) {
        setValidationError(`Amount must be at least ${ad.account_currency} ${minLimit.toFixed(2)}`)
      } else if (numAmount > maxLimit) {
        setValidationError(`Amount cannot exceed ${ad.account_currency} ${maxLimit.toFixed(2)}`)
      } else {
        setValidationError(null)
      }
    }
  }, [amount, ad])

  if (!isOpen && !isAnimating) return null

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(e.target.value)
  }

  const handleSubmit = async () => {
    if (!ad) return

    try {
      setIsSubmitting(true)
      setOrderStatus(null)

      // Convert amount to number
      const numAmount = Number.parseFloat(amount)

      // Call the API to create the order
      const order = await createOrder(ad.id, numAmount)
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
    // First set animating to false (which will trigger the closing animation)
    setIsAnimating(false)
    // Then actually close after animation completes
    setTimeout(() => {
      onClose()
    }, 300) // Match this with the CSS transition duration
  }

  const isBuy = orderType === "buy"
  const title = isBuy ? "Buy order" : "Sell order"
  const actionText = isBuy ? "Buy" : "Sell"
  const youBuyText = isBuy ? "You buy" : "You sell"
  const youSendText = isBuy ? "You send" : "You receive"

  // Format the P2P balance
  const formattedBalance = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(1234.56)

  // Calculate order limits
  const minLimit = ad?.minimum_order_amount?.toFixed(2) || "0.00"
  const maxLimit = ad?.actual_maximum_order_amount?.toFixed(2) || "0.00"

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className={`fixed inset-0 bg-black/30 transition-opacity duration-300 ${
          isOpen && isAnimating ? "opacity-100" : "opacity-0"
        }`}
        onClick={handleClose}
      />
      <div
        className={`relative w-full max-w-md bg-white h-full overflow-y-auto transform transition-transform duration-300 ease-in-out ${
          isOpen && isAnimating ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between border-b p-4">
            <h2 className="text-xl font-semibold">{title}</h2>
            <button onClick={handleClose} className="p-1 rounded-full">
              <X className="h-5 w-5" />
            </button>
          </div>

          {ad && (
            <>
              <div className="flex-1 p-4 space-y-6">
                {/* P2P Balance */}
                <div className="flex items-center justify-between py-4 rounded-lg">
                  <div className="flex items-center">
                    <span className="font-medium">P2P balance</span>
                  </div>
                  <span className="font-bold">USD {formattedBalance}</span>
                </div>

                {/* Advertiser Info */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Advertiser info</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Seller</span>
                      <span className="font-medium">{ad.user?.nickname || "Unknown"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Exchange rate (USD 1)</span>
                      <span className="font-medium">
                        {ad.payment_currency} {ad.exchange_rate?.toFixed(2) || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Order completion time</span>
                      <span className="font-medium">{ad.order_expiry_period} min</span>
                    </div>
                  </div>
                </div>

                {/* Payment Methods */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Payment method(s)</h3>
                  <div className="space-y-2">
                    {ad.payment_method_names?.map((method, index) => (
                      <div key={index} className="flex items-center">
                        {method.toLowerCase().includes("bank") ? (
                          <Building className="h-5 w-5 mr-2 text-green-600" />
                        ) : (
                          <CreditCard className="h-5 w-5 mr-2 text-blue-600" />
                        )}
                        <span>{method}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Seller Instructions */}
                <div>
                  <h3 className="text-lg font-semibold mb-2">Seller's instructions</h3>
                  <p className="text-sm">
                    Kindly transfer the payment to the account details provided after placing the order. Ensure the
                    exact amount is transferred.
                  </p>
                </div>

                {/* Order Amount */}
                <div>
                  <div className="mb-4">
                    <p className="mb-2">{youBuyText}</p>
                    <div className="flex">
                      <Input
                        type="number"
                        value={amount}
                        onChange={handleAmountChange}
                        className={`rounded-r-none border-r-0 ${validationError}`}
                      />
                      <div className="flex items-center justify-center px-4 border border-l-0 rounded-r-md">
                        {ad.account_currency}
                      </div>
                    </div>
                    {validationError && <p className="text-xs mt-1">{validationError}</p>}
                    <p className="text-xs mt-1">
                      Order limit: {ad.account_currency} {minLimit} - {maxLimit}
                    </p>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="border-t p-4">
                <div className="mb-4 flex justify-between">
                  <p className="mb-2">{youSendText}</p>
                  <span className="font-medium">
                    {ad.payment_currency}{" "}
                    {Number.parseFloat(totalAmount).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>

                <Button
                  onClick={handleSubmit}
                  className="w-full text-white rounded-full"
                  disabled={!!validationError || isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center">
                      <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                      Creating Order...
                    </span>
                  ) : (
                    `${actionText} ${ad.account_currency}`
                  )}
                </Button>
                {orderStatus && (
                  <div
                    className={`mt-4 p-3 rounded-lg flex items-start ${orderStatus.success ? "bg-green-50 text-green-800" : ""}`}
                  >
                    {orderStatus.success ? (
                      <Check className="h-5 w-5 mr-2 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                    )}
                    <span>{orderStatus.message}</span>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

