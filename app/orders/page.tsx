"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AlertCircle } from "lucide-react"
import Navigation from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { OrdersAPI } from "@/services/api"
import type { Order } from "@/services/api/api-orders"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

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
        status?: "Pending" | "Completed" | "Cancelled" | "Disputed"
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

      // If we're on the "past" tab, filter to only show completed and cancelled orders
      const filteredData =
        activeTab === "past"
          ? ordersArray.filter(
              (order) => order.status === "Completed" || order.status === "Cancelled" || order.status === "Disputed",
            )
          : ordersArray

      setOrders(filteredData)
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
      case "Completed":
        return "bg-green-100 text-green-800"
      case "Cancelled":
        return "bg-slate-100 text-slate-800"
      case "Disputed":
        return "bg-yellow-100 text-yellow-800"
      case "Expired":
        return "bg-slate-100 text-slate-800"
      default:
        return "bg-blue-100 text-blue-800"
    }
  }

  // Function to navigate to order details
  const navigateToOrderDetails = (orderId: string) => {
    router.push(`/orders/${orderId}`)
  }

  return (
    <>
      <Navigation />

      {/* Tabs */}
      <div className="mb-6">
        <Tabs defaultValue={activeTab} onValueChange={(value) => setActiveTab(value as "active" | "past")}>
          <TabsList>
            <TabsTrigger value="active">Active orders</TabsTrigger>
            <TabsTrigger value="past">Past orders</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Content */}
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
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id} className="cursor-pointer" onClick={() => navigateToOrderDetails(order.id)}>
                  <TableCell className="py-4 px-4">
                    <div className="flex items-center">
                      <span className={order.advert.type === "Buy" ? "text-green-600 font-medium" : "font-medium"}>
                        {order.type}
                      </span>
                      <span className="ml-1">{order.id}</span>
                    </div>
                  </TableCell>
                  {activeTab === "past" && (
                    <TableCell className="py-4 px-4">{order.createdAt ? formatDate(order.createdAt) : "N/A"}</TableCell>
                  )}
                  <TableCell className="py-4 px-4">{order.advert.user.nickname}</TableCell>
                  <TableCell className="py-4 px-4">
                    <span className={`px-3 py-1 rounded-full text-xs ${getStatusBadgeStyle(order.status)}`}>
                      {order.status}
                    </span>
                  </TableCell>
                  <TableCell className="py-4 px-4">
                    {order.advert.payment_currency}{" "}
                    {typeof order.amount === "object" && order.amount.value
                      ? Number(order.amount.value).toFixed(2)
                      : typeof order.amount === "number"
                        ? order.amount.toFixed(2)
                        : Number(order.amount).toFixed(2)}
                  </TableCell>
                  <TableCell className="py-4 px-4">
                    {order.advert.account_currency}{" "}
                    {typeof order.price === "object" && order.price.value
                      ? Number(order.price.value).toFixed(2)
                      : typeof order.price === "number"
                        ? order.price.toFixed(2)
                        : Number(order.price).toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  )
}

