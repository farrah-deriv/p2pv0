"use client"

import { useState } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { usePathname } from "next/navigation"
import { ArrowLeft, X } from "lucide-react"
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
    <div className="mb-4 pt-16">
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
        <>
          {/* Buy/Sell Toggle */}
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

          {/* Currency Tabs */}
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
        </>
      )}

      <BalanceInfoPopup isOpen={isBalanceInfoOpen} onClose={() => setIsBalanceInfoOpen(false)} />
    </div>
  )
}
