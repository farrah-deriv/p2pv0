"use client"

import { useState } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { usePathname } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import BalanceInfoPopup from "@/components/balance-info-popup"

interface NavigationProps {
  isVisible?: boolean
  title?: string
}

export default function Navigation({ isVisible = true, title = "P2P Wallet" }: NavigationProps) {
  const pathname = usePathname()
  const [isBalanceInfoOpen, setIsBalanceInfoOpen] = useState(false)

  const navItems = [
    { name: "Buy/Sell", href: "/" },
    { name: "Orders", href: "/orders" },
    { name: "My ads", href: "/my-ads" },
    { name: "Profile", href: "/profile" },
  ]

  return (
    <div className="mb-4 md:pt-16">
      <div className="flex items-center justify-between md:my-3 p-4 -mx-4 md:-mx-0 md:px-0 border-b md:border-none">
        <Link href="/" className="flex items-center text-slate-1400">
          <ArrowLeft className="h-5 w-5 mr-2" />
          <h1 className="text-xl font-bold">{title}</h1>
        </Link>
      </div>
      <div className="hidden md:block flex items-center justify-between mb-6">
        {isVisible && (
          <nav className="border-b border-slate-200">
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
        )}
      </div>
      <BalanceInfoPopup isOpen={isBalanceInfoOpen} onClose={() => setIsBalanceInfoOpen(false)} />
    </div>
  )
}

