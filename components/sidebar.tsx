"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Home, BarChart2, Wallet, RefreshCcw } from "lucide-react"
import { cn } from "@/lib/utils"
import { Avatar } from "@/components/ui/avatar"

export default function Sidebar() {
  const pathname = usePathname()

  const navItems = [
    { name: "Home", href: "/", icon: Home },
    { name: "Trade", href: "/trade", icon: BarChart2 },
    { name: "Wallets", href: "/wallets", icon: Wallet },
    { name: "P2P", href: "/p2p", icon: RefreshCcw },
  ]

  return (
    <div className="hidden md:flex flex-col w-[280px] fixed top-0 left-0 bottom-0 border-r border-slate-200 bg-white z-20">
      <div className="flex flex-col items-center p-6 border-b border-slate-200">
        <Avatar className="h-16 w-16 mb-2">
          <Image src="/placeholder-user.jpg" alt="User" width={64} height={64} className="rounded-full object-cover" />
        </Avatar>
        <span className="font-medium text-base">User 123456789</span>
      </div>
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navItems.map((item) => {
            const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)

            const Icon = item.icon

            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-md text-base font-medium",
                    isActive ? "bg-slate-100 text-slate-900" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {item.name}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </div>
  )
}
