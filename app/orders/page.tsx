"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AlertCircle } from "lucide-react"
import Navigation from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { OrdersAPI } from "@/services/api"
import type { Order } from "@/services/api/api-orders"

export default function OrdersPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"active" | "past">("active")

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
      } = {}

      if (activeTab === "active") {
        filters.status = "Pending"
      }
      // For past orders, we'll fetch all and filter client-side

      const data = await OrdersAPI.getOrders(filters)

      // Ensure data is an array before filtering
      const ordersArray = Array.isArray(data) ? data : []

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

  return (
    <>
      <Navigation />

      {/* Tabs */}
      <div className="mb-6">
        <div className="inline-flex bg-gray-100 rounded-lg">
          <button
            className={`px-6 py-3 rounded-lg text-base font-medium ${
              activeTab === "active" ? "bg-white shadow-sm" : "text-gray-500"
            }`}
            onClick={() => setActiveTab("active")}
          >
            Active orders
          </button>
          <button
            className={`px-6 py-3 rounded-lg text-base font-medium ${
              activeTab === "past" ? "bg-white shadow-sm" : "text-gray-500"
            }`}
            onClick={() => setActiveTab("past")}
          >
            Past orders
          </button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-red-500 border-r-transparent"></div>
          <p className="mt-2 text-gray-600">Loading orders...</p>
        </div>
      ) : error ? (
        <div className="text-center py-12 text-red-500">
          <p>{error}</p>
          <Button onClick={fetchOrders} className="mt-4 bg-red-500 hover:bg-red-600 text-white">
            Try Again
          </Button>
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <AlertCircle className="h-6 w-6 text-gray-400" />
          </div>
          <h2 className="text-xl font-medium text-gray-900 mb-2">No orders found</h2>
          <p className="text-gray-500">Start by placing your first order.</p>
          <Button
            onClick={() => router.push("/")}
            className="mt-8 bg-red-500 hover:bg-red-600 text-white rounded-full px-6"
          >
            Browse Ads
          </Button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead className="bg-gray-50">
              <tr className="text-xs sm:text-sm text-gray-500">
                <th className="text-left py-3 px-4 font-medium">Order ID</th>
                <th className="text-left py-3 px-4 font-medium">Type</th>
                <th className="text-left py-3 px-4 font-medium">Amount</th>
                <th className="text-left py-3 px-4 font-medium">Status</th>
                <th className="text-left py-3 px-4 font-medium">Counterparty</th>
                <th className="text-left py-3 px-4 font-medium">Created</th>
                <th className="text-right py-3 px-4 font-medium"></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="py-4 px-4 font-medium">{order.id}</td>
                  <td className="py-4 px-4">
                    <span className={order.type === "Buy" ? "text-green-600" : "text-red-600"}>{order.type}</span>
                  </td>
                  <td className="py-4 px-4">
                    {order.amount.value.toFixed(2)} {order.amount.currency}
                  </td>
                  <td className="py-4 px-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs ${
                        order.status === "Completed"
                          ? "bg-green-100 text-green-800"
                          : order.status === "Cancelled"
                            ? "bg-red-100 text-red-800"
                            : order.status === "Disputed"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="py-4 px-4">{order.counterparty.nickname}</td>
                  <td className="py-4 px-4">{new Date(order.createdAt).toLocaleDateString()}</td>
                  <td className="py-4 px-4 text-right">
                    <Button
                      onClick={() => router.push(`/orders/${order.id}`)}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-full text-xs"
                    >
                      View
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}

