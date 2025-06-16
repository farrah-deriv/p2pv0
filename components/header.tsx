"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { NovuNotifications } from "./novu-notifications"
import { User } from "lucide-react"

export default function Header() {
  const pathname = usePathname()

  const navItems = [
    { name: "Market", href: "/" },
    { name: "Orders", href: "/orders" },
    { name: "My Ads", href: "/ads" },
    { name: "Wallet", href: "/wallet" },
    { name: "Profile", href: "/profile" },
  ]

  return (
    <header className="hidden md:block fixed top-6 left-[295px] right-6 bg-white z-10">
      <div>
        <nav className="flex h-12 mx-6 border-b border-slate-200">
          {navItems.map((item) => {
            const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "inline-flex h-12 items-center border-b-2 px-4 text-sm",
                      isActive
                        ? "text-slate-1400 border-[#00D0FF] font-bold"
                        : "border-transparent text-slate-600 hover:border-slate-300 hover:text-slate-700"
                )}
              >
                {item.name}
              </Link>
            )
          })}
        </nav>
      </div>
      <div className="absolute top-6 right-6 h-12 flex items-center space-x-4">
        <div className="text-slate-600 hover:text-slate-700">
          <NovuNotifications />
        </div>
      </div>
    </header>
  )
}
