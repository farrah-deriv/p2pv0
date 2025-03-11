"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"
import { usePathname } from "next/navigation"
import { ArrowLeft, Monitor, Info } from "lucide-react"

export default function Navigation() {
  const pathname = usePathname()

  const navItems = [
    { name: "Buy/Sell", href: "/" },
    { name: "Orders", href: "/orders" },
    { name: "My ads", href: "/my-ads" },
    { name: "Profile", href: "/profile" },
  ]

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-6">
        <Link href="/" className="flex items-center text-gray-700">
          <ArrowLeft className="h-5 w-5 mr-2" />
          <h1 className="text-xl font-bold">Deriv P2P</h1>
        </Link>
        <div className="flex items-center gap-4">
          <button className="text-gray-500">
            <Monitor className="h-5 w-5" />
          </button>
          <div className="text-right">
            <div className="flex items-center justify-end gap-1 text-sm text-gray-500 mb-1">
              P2P balance
              <Info className="h-4 w-4 text-gray-400" />
            </div>
            <div className="font-bold">USD 1,234.56</div>
          </div>
        </div>
      </div>
      <nav className="border-b border-gray-200">
        <ul className="flex space-x-8">
          {navItems.map((item) => (
            <li key={item.name}>
              <Link
                href={item.href}
                className={cn(
                  "inline-flex h-12 items-center border-b-2 px-1 text-sm font-medium",
                  pathname === item.href
                    ? "border-red-500 text-gray-900"
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700",
                )}
              >
                {item.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}

