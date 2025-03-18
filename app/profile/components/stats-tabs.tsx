"use client"

import type React from "react"
import { useState } from "react"
import { cn } from "@/lib/utils"
import StatsGrid from "./stats-grid"
import PaymentMethodsTab from "./payment-methods-tab"
import { Button } from "@/components/ui/button"

interface StatsTabsProps {
  children?: React.ReactNode
  stats: any
}

export default function StatsTabs({ children, stats }: StatsTabsProps) {
  const [activeTab, setActiveTab] = useState("stats")

  const tabs = [
    { id: "stats", label: "Stats" },
    { id: "payment", label: "Payment methods" },
    { id: "ads", label: "Ad details" },
    { id: "counterparties", label: "My counterparties" },
  ]

  return (
    <div className="relative">
      <div className="flex justify-between items-center mb-6">
        <div className="bg-gray-100 rounded-lg overflow-hidden">
          <div className="flex">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "px-6 py-3 text-sm font-medium",
                  activeTab === tab.id ? "bg-white text-gray-900" : "bg-gray-100 text-gray-500 hover:bg-gray-50",
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {activeTab === "payment" && (
          <Button
            className="bg-red-500 hover:bg-red-600 text-white rounded-full px-4"
            onClick={() => {
              /* Add payment method logic */
            }}
          >
            Add payment method
          </Button>
        )}
      </div>

      <div>
        {activeTab === "stats" && <StatsGrid stats={stats} />}
        {activeTab === "payment" && <PaymentMethodsTab />}
        {activeTab === "ads" && <div>Ad details content</div>}
        {activeTab === "counterparties" && <div>My counterparties content</div>}
      </div>
    </div>
  )
}

