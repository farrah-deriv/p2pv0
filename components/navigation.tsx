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

  const navItems = [
    { name: "Buy/Sell", href: "/" },
    { name: "Orders", href: "/orders" },
    { name: "My ads", href: "/ads" },
    { name: "Wallet", href: "/wallet" },
    { name: "Profile", href: "/profile" },
  ]

  return (
    <div className="mb-4 md:pt-16">
      {/* Mobile title bar */}
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

      {/* Mobile navigation */}
      <div className="md:hidden flex items-center justify-between mb-6">
        {isVisible && (
          <nav className="border-b border-slate-200 w-full overflow-x-auto">
            <ul className="flex space-x-8">
              {navItems.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={cn(
                      "inline-flex h-12 items-center border-b-2 px-1 text-sm whitespace-nowrap",
                      pathname === item.href
                        ? "text-slate-1400 border-[#00D0FF] font-bold"
                        : "border-transparent text-slate-600 hover:border-slate-300 hover:text-slate-700",
                    )}
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </div>

      {/* Desktop Buy/Sell and Currency tabs */}
      {isVisible && pathname === "/" && (
        <div className="hidden md:block">
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
        </div>
      )}

      <BalanceInfoPopup isOpen={isBalanceInfoOpen} onClose={() => setIsBalanceInfoOpen(false)} />
    </div>
  )
}
