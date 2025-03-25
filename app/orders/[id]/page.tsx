"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { AlertCircle, X, ChevronRight, DollarSign, Clock } from "lucide-react"
import Navigation from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { OrdersAPI } from "@/services/api"
import type { Order } from "@/services/api/api-orders"
import OrderChat from "@/components/order-chat"

export default function OrderDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const orderId = params.id as string

  const [order, setOrder] = useState<Order | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeLeft, setTimeLeft] = useState("59:59")
  const [message, setMessage] = useState("")
  const [showCancelConfirmation, setShowCancelConfirmation] = useState(false)

  useEffect(() => {
    fetchOrderDetails()
  }, [orderId])

  const fetchOrderDetails = async () => {
    setIsLoading(true)
    setError(null)
    try {
      // Use the mock data for now since we're having issues with the API
      const order = await OrdersAPI.getOrderById(orderId)
      setOrder(order.data)
    } catch (err) {
      console.error("Error fetching order details:", err)
      setError("Failed to load order details. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="px-4">
        <Navigation />
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid  border-r-transparent"></div>
          <p className="mt-2 text-slate-600">Loading order details...</p>
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="px-4">
        <Navigation />
        <div className="text-center py-12">
          <p>{error || "Order not found"}</p>
          <Button onClick={fetchOrderDetails} className="mt-4 text-white">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  // Safely access properties with fallbacks
  const orderType = order.type === "buy" ? "Sell" : "Buy"
  const orderStatus = order.status || "Pending"
  const advertPaymentCurrency = order.payment_currency
  const advertAccountCurrency = order.advert?.account_currency

  // Safely access user properties
  const counterpartyNickname = order.advert?.user?.nickname

  const orderAmount = order.amount ? Number(order.amount).toFixed(2) : "0.00"

  return (
    <div className="px-4">
      <Navigation isVisible={false} title={`${orderType} order`} />
      <div className="container mx-auto px-4">
        <div className="flex flex-col">
          {/* Left panel - Order details */}
          <div className="flex flex-row gap-6">
            <div className="w-full lg:w-1/2 rounded-lg">
              <div className="bg-blue-50 p-4 flex justify-between items-center border border-blue-50 rounded-lg">
                <div className="flex items-center">
                  <span className="text-blue-600 font-medium">Complete payment</span>
                </div>
                <div className="flex items-center text-blue-600">
                  <Clock className="h-4 w-4 mr-1" />
                  <span>Time left: {timeLeft}</span>
                </div>
              </div>

              <div className="p-4 border rounded-lg mt-3">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <p className="text-slate-500 text-sm">You pay</p>
                    <p className="text-lg font-bold">
                      {advertPaymentCurrency}{" "}
                      {Number(orderAmount).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                  <button
                    className="flex items-center text-sm"
                    onClick={() => {
                      /* View details logic */
                    }}
                  >
                    View order details
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </button>
                </div>

                <div>
                  <p className="text-slate-500 text-sm">Seller</p>
                  <p className="font-medium">{counterpartyNickname}</p>
                </div>
              </div>

              <Tabs defaultValue="payment">
                <TabsList className="bg-transparent w-full rounded-none justify-start h-auto">
                  <TabsTrigger
                    value="payment"
                    className="py-3 px-4 data-[state=active]:border-b-2 data-[state=active]:shadow-none rounded-none"
                  >
                    Seller's payment details
                  </TabsTrigger>
                  <TabsTrigger
                    value="contact"
                    className="py-3 px-4 data-[state=active]:border-b-2 data-[state=active]:shadow-none rounded-none"
                  >
                    Contact details and instructions
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="payment" className="p-4">
                  <div className="bg-yellow-50 p-4 rounded-md mb-4">
                    <div className="flex">
                      <AlertCircle className="h-5 w-5 text-yellow-600 mr-2 flex-shrink-0" />
                      <p className="text-sm text-yellow-800">
                        Don't risk your funds with cash transactions. Use bank transfers or e-wallets instead.
                      </p>
                    </div>
                  </div>

                  <div className="border rounded-md p-4">
                    <div className="flex items-center">
                      <DollarSign className="h-5 w-5 text-blue-500 mr-2" />
                      <p className="text-slate-700">User didn't add any payment methods.</p>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="contact" className="p-4">
                  <p className="text-slate-600">No additional contact details or instructions provided.</p>
                </TabsContent>
              </Tabs>

              <div className="p-4 flex gap-4">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => setShowCancelConfirmation(true)}>
                  Cancel order
                </Button>
                <Button
                  className="flex-1"
                  size="sm"
                  onClick={() => {
                    /* Mark as paid logic */
                  }}
                >
                  I've paid
                </Button>
              </div>
            </div>
            {/* Right panel - Chat */}
            <div className="w-full lg:w-1/2 border rounded-lg overflow-hidden flex flex-col h-[600px]">
              <OrderChat
                orderId={orderId}
                counterpartyName={counterpartyNickname || "User"}
                counterpartyInitial={(counterpartyNickname || "U")[0].toUpperCase()}
              />
            </div>
          </div>
        </div>
      </div>
      {showCancelConfirmation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 relative">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Cancelling your order?</h2>
              <button onClick={() => setShowCancelConfirmation(false)} className="text-slate-500 hover:text-slate-700">
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-slate-700 mb-6">Don't cancel if you've already paid.</p>

            <div className="space-y-3">
              <Button onClick={() => setShowCancelConfirmation(false)} className="w-full">
                Keep order
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  // Add actual cancel logic here
                  setShowCancelConfirmation(false)
                  // You would typically call a function like cancelOrder(orderId) here
                }}
                className="w-full"
              >
                Cancel order
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

