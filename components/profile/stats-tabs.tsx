"use client"

import type React from "react"

import { useState } from "react"
import { cn } from "@/lib/utils"

interface StatsTabsProps {
  children: React.ReactNode
}

export default function StatsTabs({ children }: StatsTabsProps) {
  const [activeTab, setActiveTab] = useState("stats")

  const tabs = [
    { id: "stats", label: "Stats" },
    { id: "payment", label: "Payment methods" },
    { id: "ads", label: "Ad details" },
    { id: "counterparties", label: "My counterparties" },
  ]

  return (
    <div>
      <div className="border rounded-lg overflow-hidden">
        <div className="flex border-b">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "px-4 py-3 text-sm font-medium flex-1 text-center",
                activeTab === tab.id ? "bg-gray-100 text-gray-900" : "bg-white text-gray-500 hover:bg-gray-50",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  )
}

