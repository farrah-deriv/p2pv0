"use client"

import type React from "react"
import { useState } from "react"
import StatsGrid from "./stats-grid"
import PaymentMethodsTab from "./payment-methods-tab"
import { Button } from "@/components/ui/button"
import AddPaymentMethodPanel from "./add-payment-method-panel"
import { ProfileAPI } from "../api"
import StatusModal from "./ui/status-modal"
import NotificationBanner from "./notification-banner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PlusCircle } from "lucide-react"
// Add USER import at the top with other imports
import { USER, API, AUTH } from "@/lib/local-variables"
import { useEffect } from "react"

// Update the StatsTabsProps interface to make stats optional
interface StatsTabsProps {
  children?: React.ReactNode
  stats?: any
}

export default function StatsTabs({ children, stats: initialStats }: StatsTabsProps) {
  const [activeTab, setActiveTab] = useState("stats")
  const [showAddPaymentMethodPanel, setShowAddPaymentMethodPanel] = useState(false)
  const [isAddingPaymentMethod, setIsAddingPaymentMethod] = useState(false)
  const [notification, setNotification] = useState<{ show: boolean; message: string }>({
    show: false,
    message: "",
  })
  const [errorModal, setErrorModal] = useState<{ show: boolean; message: string }>({
    show: false,
    message: "",
  })
  const [refreshKey, setRefreshKey] = useState(0)
  // Modify userStats to include default values
  const [userStats, setUserStats] = useState<any>(
    initialStats || {
      buyCompletion: { rate: "N/A", period: "(30d)" },
      sellCompletion: { rate: "N/A", period: "(30d)" },
      avgPayTime: { time: "N/A", period: "(30d)" },
      avgReleaseTime: { time: "N/A", period: "(30d)" },
      tradePartners: 0,
      totalOrders30d: 0,
      totalOrdersLifetime: 0,
      tradeVolume30d: { amount: "0.00", currency: "USD", period: "(30d)" },
      tradeVolumeLifetime: { amount: "0.00", currency: "USD" },
    },
  )

  const [isLoadingStats, setIsLoadingStats] = useState(false)

  const tabs = [
    { id: "stats", label: "Stats" },
    { id: "payment", label: "Payment methods" },
    { id: "ads", label: "Ad details" },
    { id: "counterparties", label: "My counterparties" },
  ]

  // Add useEffect to fetch user stats
  useEffect(() => {
    const fetchUserStats = async () => {
      try {
        setIsLoadingStats(true)
        const userId = USER.id
        const url = `${API.baseUrl}/users/${userId}`

        console.log(`Fetching user stats for user ID: ${userId}`)

        const response = await fetch(url, {
          headers: {
            ...AUTH.getAuthHeader(),
            accept: "application/json",
          },
        })

        if (!response.ok) {
          throw new Error(`Failed to fetch user stats: ${response.status} ${response.statusText}`)
        }

        const responseData = await response.json()
        console.log("User stats API response:", responseData)

        // If we have data, transform it to match the expected format and update the stats state
        if (responseData && responseData.data) {
          const data = responseData.data

          // Format the time values (from seconds to minutes)
          const formatTimeAverage = (minutes) => {
            if (!minutes || minutes <= 0) return "N/A"
            // Display minutes as is without any cap
            return `${minutes} min`
          }

          // Calculate total orders and amounts for 30 days
          const totalOrders30d = (data.buy_count_30day || 0) + (data.sell_count_30day || 0)
          const totalAmount30d = (data.buy_amount_30day || 0) + (data.sell_amount_30day || 0)

          // Format completion rates
          const formatCompletionRate = (rate, count) => {
            if (rate === null || rate === undefined) return "N/A"
            return `${rate}% (${count || 0})`
          }

          // Transform the data to match the expected format
          const transformedStats = {
            buyCompletion: {
              // For Buy completion, we should show the completion rate with buy count
              rate: `${data.completion_average_30day || 0}%`,
              period: "(30d)",
            },
            sellCompletion: {
              // For Sell completion, we should show the completion rate with sell count
              rate: `${data.completion_average_30day || 0}%`,
              period: "(30d)",
            },
            avgPayTime: {
              // For Avg. pay time, use buy_time_average_30day
              time: formatTimeAverage(data.buy_time_average_30day),
              period: "(30d)",
            },
            avgReleaseTime: {
              // For Avg. release time, use release_time_average_30day
              time: formatTimeAverage(data.release_time_average_30day),
              period: "(30d)",
            },
            tradePartners: data.trade_partners || 0,
            // Total orders (30d) is buy_count_30day + sell_count_30day
            totalOrders30d: (data.buy_count_30day || 0) + (data.sell_count_30day || 0),
            // Total orders lifetime is order_count_lifetime
            totalOrdersLifetime: data.order_count_lifetime || 0,
            tradeVolume30d: {
              // Trade volume 30d is buy_amount_30day + sell_amount_30day
              amount: ((data.buy_amount_30day || 0) + (data.sell_amount_30day || 0)).toFixed(2),
              currency: "USD",
              period: "(30d)",
            },
            tradeVolumeLifetime: {
              // Trade volume lifetime is order_amount_lifetime
              amount: data.order_amount_lifetime ? data.order_amount_lifetime.toFixed(2) : "0.00",
              currency: "USD",
            },
          }

          console.log("Transformed stats:", transformedStats)
          setUserStats(transformedStats)
        }
      } catch (error) {
        console.error("Error fetching user stats:", error)
      } finally {
        setIsLoadingStats(false)
      }
    }

    fetchUserStats()
  }, [])

  const handleAddPaymentMethod = async (method: string, fields: Record<string, string>) => {
    try {
      setIsAddingPaymentMethod(true)

      // Log the data being sent to the API for debugging
      console.group("🔍 PAYMENT METHOD DATA FROM UI")
      console.log("Method:", method)
      console.log("Fields:", fields)
      console.groupEnd()

      const result = await ProfileAPI.PaymentMethods.addPaymentMethod(method, fields)

      // Log the result
      console.group("🔍 PAYMENT METHOD API RESULT")
      console.log("Success:", result.success)
      console.log("Data:", result.data)
      console.log("Errors:", result.errors)
      console.groupEnd()

      if (result.success) {
        // Close the panel
        setShowAddPaymentMethodPanel(false)

        // Show success notification
        setNotification({
          show: true,
          message: "Payment method added.",
        })

        // Refresh the payment methods list by incrementing the key
        setRefreshKey((prev) => prev + 1)
      } else {
        // Get error message from the first error
        const errorMessage =
          result.errors && result.errors.length > 0 ? result.errors[0].message : "Failed to add payment method"

        // Show error modal
        setErrorModal({
          show: true,
          message: errorMessage,
        })
      }
    } catch (error) {
      console.error("Error adding payment method:", error)

      // Show error modal
      setErrorModal({
        show: true,
        message: error instanceof Error ? error.message : "An unexpected error occurred",
      })
    } finally {
      setIsAddingPaymentMethod(false)
    }
  }

  return (
    <div className="relative">
      {notification.show && (
        <NotificationBanner
          message={notification.message}
          onClose={() => setNotification({ show: false, message: "" })}
        />
      )}

      <Tabs defaultValue="stats" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex justify-between items-center mb-6">
          <TabsList className="bg-gray-100">
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="px-6 py-3 text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-primary"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {activeTab === "payment" && (
            <Button variant="primary" size="sm" onClick={() => setShowAddPaymentMethodPanel(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add payment method
            </Button>
          )}
        </div>

        <TabsContent value="stats">
          {isLoadingStats ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="border rounded-lg p-4">
                    <div className="animate-pulse bg-gray-200 h-4 w-3/4 mb-2 rounded"></div>
                    <div className="animate-pulse bg-gray-200 h-6 w-1/2 rounded"></div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="border rounded-lg p-4">
                    <div className="animate-pulse bg-gray-200 h-4 w-3/4 mb-2 rounded"></div>
                    <div className="animate-pulse bg-gray-200 h-6 w-1/2 rounded"></div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <StatsGrid stats={userStats} />
          )}
        </TabsContent>
        <TabsContent value="payment">
          <PaymentMethodsTab key={refreshKey} />
        </TabsContent>
        <TabsContent value="ads">
          <div className="p-4 border rounded-lg">
            <h3 className="text-lg font-medium mb-4">Ad details</h3>
            <p className="text-gray-500">Your ad details will appear here.</p>
          </div>
        </TabsContent>
        <TabsContent value="counterparties">
          <div className="p-4 border rounded-lg">
            <h3 className="text-lg font-medium mb-4">My counterparties</h3>
            <p className="text-gray-500">Your counterparties will appear here.</p>
          </div>
        </TabsContent>
      </Tabs>

      {showAddPaymentMethodPanel && (
        <AddPaymentMethodPanel
          onClose={() => setShowAddPaymentMethodPanel(false)}
          onAdd={handleAddPaymentMethod}
          isLoading={isAddingPaymentMethod}
        />
      )}

      {errorModal.show && (
        <StatusModal
          type="error"
          title="Error"
          message={errorModal.message}
          onClose={() => setErrorModal({ show: false, message: "" })}
        />
      )}
    </div>
  )
}
