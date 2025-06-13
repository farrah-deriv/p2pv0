"use client"

import { useState } from "react"
import { Search, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default function MarketNavigation() {
  const [activeTab, setActiveTab] = useState("Buy")
  const [activeCurrency, setActiveCurrency] = useState("USD")

  const currencies = ["USD", "BTC", "LTC", "ETH", "USDT"]

  return (
    <div className="hidden md:block pt-16 pb-4 px-6 bg-white">
      <div className="flex flex-col space-y-4">
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            className={cn(
              "flex-1 rounded-l-md rounded-r-none border border-slate-200",
              activeTab === "Buy" ? "bg-white text-slate-900 font-medium" : "bg-slate-100 text-slate-600",
            )}
            onClick={() => setActiveTab("Buy")}
          >
            Buy
          </Button>
          <Button
            variant="ghost"
            className={cn(
              "flex-1 rounded-l-none rounded-r-md border border-slate-200",
              activeTab === "Sell" ? "bg-white text-slate-900 font-medium" : "bg-slate-100 text-slate-600",
            )}
            onClick={() => setActiveTab("Sell")}
          >
            Sell
          </Button>
        </div>

        <div className="flex space-x-2">
          {currencies.map((currency) => (
            <Button
              key={currency}
              variant="ghost"
              className={cn(
                "px-4 py-2 rounded-full",
                activeCurrency === currency ? "bg-black text-white" : "bg-white text-slate-600 border border-slate-200",
              )}
              onClick={() => setActiveCurrency(currency)}
            >
              {currency}
            </Button>
          ))}
        </div>

        <div className="flex space-x-2">
          <div className="relative w-28">
            <Button variant="outline" className="w-full justify-between">
              IDR <ChevronDown className="h-4 w-4 ml-2" />
            </Button>
          </div>

          <div className="relative w-48">
            <Button variant="outline" className="w-full justify-between">
              Payment (All) <ChevronDown className="h-4 w-4 ml-2" />
            </Button>
          </div>

          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input placeholder="Enter nickname" className="pl-10" />
          </div>

          <div className="relative w-48">
            <Button variant="outline" className="w-full justify-between">
              Sort by: Exch <ChevronDown className="h-4 w-4 ml-2" />
            </Button>
          </div>

          <div className="relative w-36">
            <Button variant="outline" className="w-full justify-between">
              Filter by <ChevronDown className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-3 text-sm text-slate-600 border-b border-slate-200 pb-2">
          <div>Advertisers</div>
          <div>Rates</div>
          <div>Payment methods</div>
        </div>
      </div>
    </div>
  )
}
