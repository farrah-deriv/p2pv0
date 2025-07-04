"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { NovuNotifications } from "./novu-notifications"
import { Button } from "@/components/ui/button"
import * as AuthAPI from "@/services/api/api-auth"

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
    <header className="hidden md:flex justify-between items-center p-4 z-10">
      <div>
        <nav className="flex h-12 mx-4 border-b border-slate-200">
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
      <div className="h-12 flex items-center space-x-4">
        <div className="text-slate-600 hover:text-slate-700">
          <NovuNotifications />
        </div>
        <Button
          size="sm"
          onClick={() => AuthAPI.logout()}>
          Logout
        </Button>
      </div>
    </header>
  )
}
