"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { AlertCircle, X, ChevronRight, DollarSign, Clock, Star, ThumbsUp, ThumbsDown } from "lucide-react"
import Navigation from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { OrdersAPI } from "@/services/api"
import type { Order } from "@/services/api/api-orders"
import OrderChat from "@/components/order-chat"
import { toast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"

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
  const [isPaymentLoading, setIsPaymentLoading] = useState(false)

  // Rating states
  const [showRatingSidebar, setShowRatingSidebar] = useState(false)
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [recommend, setRecommend] = useState<boolean | null>(null)
  const [isSubmittingReview, setIsSubmittingReview] = useState(false)

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

  const handlePayOrder = async () => {
    setIsPaymentLoading(true)
    try {
      const result = await OrdersAPI.payOrder(orderId)
      if (result.success) {
        toast({
          title: "Payment marked as sent",
          description: "The seller has been notified of your payment.",
          variant: "default",
        })
        fetchOrderDetails() // Refresh order details
      }
    } catch (err) {
      console.error("Error marking payment as sent:", err)
      toast({
        title: "Payment notification failed",
        description: "Could not mark payment as sent. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsPaymentLoading(false)
    }
  }

  const handleSubmitReview = async () => {
    if (rating === 0) {
      toast({
        title: "Rating required",
        description: "Please select a star rating before submitting.",
        variant: "destructive",
      })
      return
    }

    setIsSubmittingReview(true)
    try {
      const reviewData = {
        rating,
        recommend,
      }

      const result = await OrdersAPI.reviewOrder(orderId, reviewData)
      if (result.errors.length === 0) {
        toast({
          title: "Review submitted",
          description: "Thank you for your feedback!",
          variant: "default",
        })
        setShowRatingSidebar(false)
        fetchOrderDetails() // Refresh order details
      }
    } catch (err) {
      console.error("Error submitting review:", err)
      toast({
        title: "Review submission failed",
        description: "Could not submit your review. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmittingReview(false)
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
    <div className="px-4 relative">
      <Navigation isVisible={false} title={`${orderType} order`} redirectUrl={"/orders"}/>
      <div className="container mx-auto px-4">
        <div className="flex flex-col">
          {/* Left panel - Order details */}
          <div className="flex flex-row gap-6">
            <div className="w-full lg:w-1/2 rounded-lg">
              {order.status === "pending_payment" && (
                <div className="bg-blue-50 p-4 flex justify-between items-center border border-blue-50 rounded-lg">
                  <div className="flex items-center">
                    <span className="text-blue-600 font-medium">Complete payment</span>
                  </div>
                  <div className="flex items-center text-blue-600">
                    <Clock className="h-4 w-4 mr-1" />
                    <span>Time left: {timeLeft}</span>
                  </div>
                </div>
              )}

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

              {order.type === "sell" && order.status === "pending_payment" && (
                <div className="p-4 flex gap-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => setShowCancelConfirmation(true)}
                  >
                    Cancel order
                  </Button>
                  <Button className="flex-1" size="sm" onClick={handlePayOrder} disabled={isPaymentLoading}>
                    {isPaymentLoading ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent mr-2"></div>
                        Processing...
                      </>
                    ) : (
                      "I've paid"
                    )}
                  </Button>
                </div>
              )}
              {order.status === "completed" && order.is_reviewable && (
                <div className="p-4">
                  <Button variant="destructive" size="sm" className="w-full" onClick={() => setShowRatingSidebar(true)}>
                    Rate order
                  </Button>
                </div>
              )}
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

      {/* Cancel Confirmation Modal */}
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

      {/* Rating Sidebar */}
      {showRatingSidebar && (
        <div className="fixed inset-0 bg-black/50 flex justify-end z-50">
          <div className="bg-white w-full max-w-md h-full flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-lg font-bold">Rate this transaction</h2>
              <button onClick={() => setShowRatingSidebar(false)} className="text-slate-500 hover:text-slate-700">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-4">
              <div className="space-y-8">
                {/* Star Rating */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">How would you rate this transaction?</h3>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="text-2xl focus:outline-none"
                      >
                        <Star
                          className={cn(
                            "h-5 w-5",
                            (hoverRating || rating) >= star ? "fill-yellow-400 text-yellow-400" : "text-gray-300",
                          )}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Recommendation */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Would you recommend this Seller?</h3>
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => setRecommend(true)}
                      className={cn(
                        "flex items-center gap-2 px-6 py-2 border rounded-md",
                        recommend === true ? "border-green-500 bg-green-50" : "border-gray-300",
                      )}
                    >
                      <ThumbsUp className={cn("h-5 w-5", recommend === true ? "text-green-500" : "text-gray-400")} />
                      <span className={cn(recommend === true ? "text-green-700" : "text-gray-600")}>Yes</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRecommend(false)}
                      className={cn(
                        "flex items-center gap-2 px-6 py-2 border rounded-md",
                        recommend === false ? "border-red-500 bg-red-50" : "border-gray-300",
                      )}
                    >
                      <ThumbsDown className={cn("h-5 w-5", recommend === false ? "text-red-500" : "text-gray-400")} />
                      <span className={cn(recommend === false ? "text-red-700" : "text-gray-600")}>No</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t">
              <Button
                onClick={handleSubmitReview}
                disabled={isSubmittingReview || rating === 0}
                className="w-full"
              >
                {isSubmittingReview ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent mr-2"></div>
                    Submitting...
                  </>
                ) : (
                  "Submit"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

