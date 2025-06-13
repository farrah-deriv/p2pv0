"use client"

import { useState } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { usePathname } from "next/navigation"
import { ArrowLeft, X, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import BalanceInfoPopup from "@/components/balance-info-popup"

interface NavigationProps {
  isBackBtnVisible?: boolean
  isVisible?: boolean
  redirectUrl?: string
  title?: string
}

export default function Navigation({
  isBackBtnVisible = false,
  isVisible = true,
  redirectUrl = "/",
  title,
}: NavigationProps) {
  const pathname = usePathname()
  const [isBalanceInfoOpen, setIsBalanceInfoOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<"buy" | "sell">("buy")
  const [activeCurrency, setActiveCurrency] = useState<string>("USD")

  const currencies = ["USD", "BTC", "LTC", "ETH", "USDT"]

  return (
    <div className="mb-4 md:pt-16">
      {title && (
        <div className="flex items-center justify-between md:my-3 p-4 -mx-4 md:-mx-0 md:px-0 border-b md:border-none">
          {isBackBtnVisible ? (
            <Link href={redirectUrl} className="flex items-center text-slate-1400">
              <ArrowLeft className="h-5 w-5 mr-2" />
              <h1 className="text-xl font-bold">{title}</h1>
            </Link>
          ) : (
            <>
              <h1 className="text-xl font-bold">{title}</h1>
              <Link href={redirectUrl}>
                <X className="h-5 w-5" />
              </Link>
            </>
          )}
        </div>
      )}

      {isVisible && pathname === "/" && (
        <div className="hidden md:block">
          <div className="flex mb-4">
            <div className="grid grid-cols-2 w-full max-w-xs rounded-md overflow-hidden border border-slate-200">
              <button
                onClick={() => setActiveTab("buy")}
                className={cn(
                  "py-3 px-4 text-center font-medium",
                  activeTab === "buy" ? "bg-white" : "bg-slate-100 text-slate-600",
                )}
              >
                Buy
              </button>
              <button
                onClick={() => setActiveTab("sell")}
                className={cn(
                  "py-3 px-4 text-center font-medium",
                  activeTab === "sell" ? "bg-white" : "bg-slate-100 text-slate-600",
                )}
              >
                Sell
              </button>
            </div>
          </div>

          <div className="flex space-x-2 mb-4 overflow-x-auto pb-1">
            {currencies.map((currency) => (
              <button
                key={currency}
                onClick={() => setActiveCurrency(currency)}
                className={cn(
                  "px-4 py-2 rounded-full font-medium min-w-[60px]",
                  activeCurrency === currency
                    ? "bg-black text-white"
                    : "bg-white text-slate-600 border border-slate-200",
                )}
              >
                {currency}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-4 gap-3 mb-6">
            <div className="flex items-center border rounded-md px-3 py-2">
              <span>IDR</span>
              <svg className="ml-2 h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M6 9L12 15L18 9"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            <div className="flex items-center border rounded-md px-3 py-2">
              <span>Payment (All)</span>
              <svg className="ml-2 h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M6 9L12 15L18 9"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input className="pl-10" placeholder="Enter nickname" />
            </div>

            <div className="flex gap-2">
              <div className="flex items-center border rounded-md px-3 py-2 flex-1">
                <span>Sort by: Exch</span>
                <svg className="ml-2 h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M6 9L12 15L18 9"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              <div className="flex items-center border rounded-md px-3 py-2">
                <span>Filter by</span>
                <svg className="ml-2 h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M6 9L12 15L18 9"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-2 px-4">
            <div className="text-sm text-slate-600">Advertisers</div>
            <div className="text-sm text-slate-600">Rates</div>
            <div className="text-sm text-slate-600">Payment methods</div>
          </div>
        </div>
      )}

      <BalanceInfoPopup isOpen={isBalanceInfoOpen} onClose={() => setIsBalanceInfoOpen(false)} />
    </div>
  )
}
