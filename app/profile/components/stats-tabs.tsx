"use client"

import type React from "react"
import { useState } from "react"
import StatsGrid from "./stats-grid"
import PaymentMethodsTab from "./payment-methods-tab"
import { Button } from "@/components/ui/button"
import AddPaymentMethodPanel from "./add-payment-method-panel"
import { ProfileAPI } from "../api"
import StatusModal from "@/components/ui/status-modal"
import NotificationBanner from "./notification-banner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PlusCircle } from "lucide-react"

interface StatsTabsProps {
  children?: React.ReactNode
  stats: any
}

export default function StatsTabs({ children, stats }: StatsTabsProps) {
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

  const tabs = [
    { id: "stats", label: "Stats" },
    { id: "payment", label: "Payment methods" },
    { id: "ads", label: "Ad details" },
    { id: "counterparties", label: "My counterparties" },
  ]

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
            <Button size="sm" onClick={() => setShowAddPaymentMethodPanel(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add payment method
            </Button>
          )}
        </div>

        <TabsContent value="stats">
          <StatsGrid stats={stats} />
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

