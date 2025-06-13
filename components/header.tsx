"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"

export default function Header() {
  const pathname = usePathname()
  const [activeTab, setActiveTab] = useState<"buy" | "sell">("buy")
  const [activeCurrency, setActiveCurrency] = useState<string>("USD")

  const navItems = [
    { name: "Market", href: "/" },
    { name: "Orders", href: "/orders" },
    { name: "My Ads", href: "/my-ads" },
    { name: "Wallet", href: "/wallet" },
    { name: "Profile", href: "/profile" },
  ]

  const currencies = ["USD", "BTC", "LTC", "ETH", "USDT"]

  return (
    <header className="fixed top-0 left-[280px] right-0 bg-white z-10">
      <div className="border-b border-slate-200">
        <nav className="flex h-16">
          {navItems.map((item) => {
            const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "inline-flex h-full items-center px-6 text-base font-medium relative",
                  isActive ? "text-[#00D0FF] border-b-2 border-[#00D0FF]" : "text-slate-600 hover:text-slate-900",
                )}
              >
                {item.name}
              </Link>
            )
          })}
        </nav>
      </div>

      {pathname === "/" && (
        <div className="p-4">
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
    </header>
  )
}
