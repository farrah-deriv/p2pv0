"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { ArrowLeftRight, FileText, LayoutGrid, User } from "lucide-react"

export default function MobileFooterNav() {
  const pathname = usePathname()

  const navItems = [
    { name: "Buy/Sell", href: "/", icon: ArrowLeftRight },
    { name: "Orders", href: "/orders", icon: FileText },
    { name: "My ads", href: "/my-ads", icon: LayoutGrid },
    { name: "Profile", href: "/profile", icon: User },
  ]

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon

          return (
            <Link key={item.name} href={item.href} className="flex flex-col items-center justify-center w-full h-full">
              <Icon className={`h-5 w-5 mb-1 ${isActive ? "text-red-500" : "text-gray-500"}`} />
              <span className={`text-xs ${isActive ? "text-red-500 font-medium" : "text-gray-500"}`}>{item.name}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

