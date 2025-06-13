"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

export default function Header() {
  const pathname = usePathname()

  const navItems = [
    { name: "Market", href: "/" },
    { name: "Orders", href: "/orders" },
    { name: "My Ads", href: "/my-ads" },
    { name: "Wallet", href: "/wallet" },
    { name: "Profile", href: "/profile" },
  ]

  return (
    <header className="fixed top-0 left-[280px] right-0 bg-white z-10 border-b border-slate-200">
      <div className="h-16">
        <nav className="flex h-full">
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
    </header>
  )
}
