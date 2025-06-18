"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { AlertCircle, Clock } from "lucide-react"
import Navigation from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { OrdersAPI } from "@/services/api"
import type { Order } from "@/services/api/api-orders"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"

export default function OrdersPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<"active" | "past">("active")
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchOrders()
  }, [activeTab])

  const fetchOrders = async () => {
    setIsLoading(true)
    setError(null)
    try {
      // Determine filters based on active tab
      const filters: {
        is_open?: boolean
      } = {}

      if (activeTab === "active") {
        filters.is_open = true
      } else if (activeTab === "past") {
        filters.is_open = false
      }
      // For past orders, we'll fetch with is_open: false and still filter client-side

      const orders = await OrdersAPI.getOrders(filters)

      // Ensure data is an array before filtering
      const ordersArray = Array.isArray(orders.data) ? orders.data : []
      setOrders(ordersArray)
    } catch (err) {
      console.error("Error fetching orders:", err)
      setError("Failed to load orders. Please try again.")
      setOrders([])
    } finally {
      setIsLoading(false)
    }
  }

  // Function to format date as DD MMM YYYY
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  }

  // Function to get status badge style
  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800"
      case "cancelled":
        return "bg-slate-100 text-slate-800"
      case "disputed":
        return "bg-yellow-100 text-yellow-800"
      case "timed_out":
        return "bg-slate-100 text-slate-800"
      default:
        return "bg-blue-100 text-blue-800"
    }
  }

  // Function to navigate to order details
  const navigateToOrderDetails = (orderId: string) => {
    router.push(`/orders/${orderId}`)
  }

  // Mobile card view for orders
  const MobileOrderCards = () => (
    <div className="space-y-4">
      {orders.map((order) => {
        const orderType = order.type
        const orderTypeColor = orderType === "buy" ? "text-green-500" : "text-red-500"
        const statusText = order.status
        const statusStyle = getStatusBadgeStyle(order.status)

        return (
          <Card
            key={order.id}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigateToOrderDetails(order.id)}
          >
            <CardContent className="p-4">
              <div className="flex justify-between items-center mb-4">
                <span className={`px-3 py-1 rounded-full text-xs ${statusStyle}`}>{statusText}</span>
                <div className="flex items-center text-slate-500">
                  <Clock className="h-4 w-4 mr-1" />
                  <span className="text-xs">00:59:59</span>
                </div>
              </div>

              <div className="mb-2">
                <span className={`text-base font-medium ${orderTypeColor}`}>{orderType}</span>
                <span className="text-base font-medium"> {order.advert.payment_currency} </span>
                <span className="text-base font-medium">
                  {typeof order.amount === "object" && order.amount.value
                    ? Number(order.amount.value).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })
                    : typeof order.amount === "number"
                      ? order.amount.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })
                      : Number(order.amount).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <div className="text-xs text-slate-500">ID: {order.id}</div>
                <div className="flex items-center space-x-2">
                  <Button
                    onClick={(e) => {
                      e.stopPropagation()
                      navigateToOrderDetails(order.id)
                    }}
                    className="text-slate-500 hover:text-slate-700"
                    variant="ghost"
                  >
                    <Image
                      src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-9Nwf9GLJPQ6HUQ8qsdDIBqeJZRacom.png"
                      alt="Chat"
                      width={20}
                      height={20}
                    />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )

  // Desktop table view for orders
  const DesktopOrderTable = () => (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="py-4 px-4 text-slate-600 font-normal">Order ID</TableHead>
            {activeTab === "past" && <TableHead className="py-4 px-4 text-slate-600 font-normal">Date</TableHead>}
            <TableHead className="py-4 px-4 text-slate-600 font-normal">Counterparty</TableHead>
            <TableHead className="py-4 px-4 text-slate-600 font-normal">Status</TableHead>
            <TableHead className="py-4 px-4 text-slate-600 font-normal">Send</TableHead>
            <TableHead className="py-4 px-4 text-slate-600 font-normal">Receive</TableHead>
            {activeTab === "past" && <TableHead className="py-4 px-4 text-slate-600 font-normal">Rating</TableHead>}
            <TableHead className="py-4 px-4 text-slate-600 font-normal"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id} className="cursor-pointer" onClick={() => navigateToOrderDetails(order.id)}>
              <TableCell className="py-4 px-4">
                <div className="flex items-center">
                  <span className={order.type === "sell" ? "text-green-600 font-medium" : "font-medium"}>
                    {order.type === "buy" ? "Buy" : "Sell"}
                  </span>
                  <span className="ml-1">{order.id}</span>
                </div>
              </TableCell>
              {activeTab === "past" && (
                <TableCell className="py-4 px-4">{order.created_at ? formatDate(order.created_at) : ""}</TableCell>
              )}
              <TableCell className="py-4 px-4">
                {order.advert.user.nickname}
              </TableCell>
              <TableCell className="py-4 px-4">
                <span className={`px-3 py-1 rounded-full text-xs ${getStatusBadgeStyle(order.status)}`}>
                  {order.status}
                </span>
              </TableCell>
              <TableCell className="py-4 px-4">
                {order.advert.payment_currency}{" "}
                {typeof order.amount === "object" && order.amount.value
                  ? Number(order.amount.value).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })
                  : typeof order.amount === "number"
                    ? order.amount.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })
                    : Number(order.amount).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
              </TableCell>
              <TableCell className="py-4 px-4">
                {order.advert.account_currency}{" "}
                {typeof order.price === "object" && order.price.value
                  ? Number(order.price.value).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })
                  : typeof order.price === "number"
                    ? order.price.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })
                    : Number(order.price).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
              </TableCell>
              {activeTab === "past" && (
                <TableCell className="py-4 px-4">
                  {order.rating > 0 && (
                    <div className="flex">
                      <Image src="/icons/star-icon.png" alt="Chat" width={20} height={20} className="mr-1" />
                      {order.rating}
                    </div>
                  )}
                </TableCell>
              )}
              <TableCell className="py-4 px-4">
                <Button
                  onClick={(e) => {
                    e.stopPropagation()
                    navigateToOrderDetails(order.id)
                  }}
                  className="text-slate-500 hover:text-slate-700"
                  variant="ghost"
                >
                  <Image
                    src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-9Nwf9GLJPQ6HUQ8qsdDIBqeJZRacom.png"
                    alt="Chat"
                    width={20}
                    height={20}
                  />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )

  return (
    <div className="flex flex-col h-full px-4">
      <div className="flex-shrink-0">
  
        <div className="mb-6">
          <Tabs defaultValue={activeTab} onValueChange={(value) => setActiveTab(value as "active" | "past")}>
            <TabsList>
              <TabsTrigger value="active">Active orders</TabsTrigger>
              <TabsTrigger value="past">Past orders</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Content - Scrollable area */}
      <div className="flex-1 overflow-y-auto pb-4">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-r-transparent"></div>
            <p className="mt-2 text-slate-600">Loading orders...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p>{error}</p>
            <Button onClick={fetchOrders} className="mt-4 text-white">
              Try Again
            </Button>
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
              <AlertCircle className="h-6 w-6 text-slate-400" />
            </div>
            <h2 className="text-xl font-medium text-slate-900 mb-2">No orders found</h2>
            <p className="text-slate-500">Start by placing your first order.</p>
            <Button size="sm" onClick={() => router.push("/")} className="mt-8">
              Browse Ads
            </Button>
          </div>
        ) : (
          <>
            {/* Mobile view (cards) */}
            <div className="md:hidden">
              <MobileOrderCards />
            </div>

            {/* Desktop view (table) */}
            <div className="hidden md:block">
              <DesktopOrderTable />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
