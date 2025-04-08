"use client"

import { useState } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { usePathname } from "next/navigation"
import { ArrowLeft, Info } from "lucide-react"
import BalanceInfoPopup from "@/components/balance-info-popup"

export default function Navigation() {
  const pathname = usePathname()
  const [isBalanceInfoOpen, setIsBalanceInfoOpen] = useState(false)

  const navItems = [
    { name: "Buy/Sell", href: "/" },
    { name: "Orders", href: "/orders" },
    { name: "My ads", href: "/ads" },
    { name: "Profile", href: "/profile" },
  ]

  return (
    <div className="mb-6 md:pt-16">
      <div className="flex items-center justify-between my-6">
        <Link href="/" className="flex items-center text-slate-1400">
          <ArrowLeft className="h-5 w-5 mr-2" />
          <h1 className="text-xl font-bold">P2P Wallet</h1>
        </Link>
      </div>
      <div className="flex items-center justify-between mb-6">
        <nav className="hidden md:block border-b border-slate-200">
          <ul className="flex space-x-8">
            {navItems.map((item) => (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    "inline-flex h-12 items-center border-b-2 px-1 text-sm",
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
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="flex items-center justify-end gap-1 text-sm text-slate-500 mb-1 pl-0">
              <span className="whitespace-nowrap -ml-1">P2P balance</span>
              <button
                onClick={() => setIsBalanceInfoOpen(true)}
                className="focus:outline-none"
                aria-label="P2P balance information"
              >
                <Info className="h-4 w-4 text-slate-600 hover:text-slate-700" />
              </button>
            </div>
            <div className="font-bold">USD 1,234.56</div>
          </div>
        </div>
      </div>

      <BalanceInfoPopup isOpen={isBalanceInfoOpen} onClose={() => setIsBalanceInfoOpen(false)} />
    </div>
  )
}
