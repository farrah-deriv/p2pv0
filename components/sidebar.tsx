"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Avatar } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { Home, BarChart2, Wallet, MessageSquare } from "lucide-react"

export default function Sidebar() {
  const pathname = usePathname()

  const navItems = [
    { name: "Home", href:"https://hub.deriv.com/tradershub", icon: Home },
    { name: "Trade", href:"https://hub.deriv.com/tradershub/cfds", icon: BarChart2 },
    { name: "Wallets", href:"https://hub.deriv.com/tradershub/wallets", icon: Wallet },
    { name: "P2P", href: "/", icon: MessageSquare },
  ]

  return (
    <div className="hidden md:flex fixed left-0 top-0 bottom-0 w-[280px] flex-col border-r border-slate-200 bg-white">
      <div className="flex flex-col items-center pt-8 pb-6">
        <Avatar className="h-16 w-16">
          <img src="/placeholder-user.jpg" alt="User avatar" />
        </Avatar>
        <h2 className="mt-4 text-base font-medium">User 123456789</h2>
      </div>
      <nav className="flex-1 px-4 pt-4">
        <ul className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = item.href === pathname

            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium",
                    isActive ? "bg-slate-100 text-slate-900" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
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
