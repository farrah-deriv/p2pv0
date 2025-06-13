"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Home, BarChart2, Wallet2, MessageSquare } from "lucide-react"
import Image from "next/image"

export default function Sidebar() {
  const pathname = usePathname()

  const navItems = [
    { name: "Home", href:"https://hub.deriv.com/tradershub", icon: <Home className="h-5 w-5" /> },
    { name: "Trade", href:"https://hub.deriv.com/tradershub/cfds", icon: <BarChart2 className="h-5 w-5" /> },
    { name: "Wallets", href: "https://hub.deriv.com/tradershub/wallets", icon: <Wallet2 className="h-5 w-5" /> },
    { name: "P2P", href: "/", icon: <MessageSquare className="h-5 w-5" /> },
  ]

  return (
    <div className="fixed left-0 top-0 bottom-0 w-[280px] border-r border-slate-200 bg-white z-20">
      <div className="flex flex-col h-full">
        <div className="p-6">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-slate-800 overflow-hidden">
              <Image src="/placeholder-user.jpg" alt="User" width={48} height={48} className="object-cover" />
            </div>
            <div>
              <h2 className="font-medium">User 123456789</h2>
            </div>
          </div>
        </div>

        <nav className="mt-6">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const isActive = item.name === "P2P"

              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-6 py-3 text-sm font-medium",
                      isActive
                        ? "bg-slate-100 text-slate-900"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                    )}
                  >
                    {item.icon}
                    {item.name}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>
      </div>
    </div>
  )
}
