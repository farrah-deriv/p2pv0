"use client"

import { Home, BarChart2, Wallet2 } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import Image from "next/image"

export default function Sidebar() {
  const pathname = usePathname()

  const navItems = [
    { name: "Home", href: "/", icon: <Home className="h-5 w-5" /> },
    { name: "Trade", href: "/trade", icon: <BarChart2 className="h-5 w-5" /> },
    { name: "Wallets", href: "/wallets", icon: <Wallet2 className="h-5 w-5" /> },
    { name: "P2P", href: "/", icon: null, isP2P: true },
  ]

  return (
    <div className="fixed left-0 top-0 h-full w-[280px] bg-white border-r border-slate-200 z-20 flex flex-col">
      <div className="p-6 flex items-center space-x-3">
        <div className="h-12 w-12 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden">
          <Image
            src="/placeholder-user.jpg"
            alt="User avatar"
            width={48}
            height={48}
            className="h-full w-full object-cover"
          />
        </div>
        <div>
          <p className="font-medium">User 123456789</p>
        </div>
      </div>

      <nav className="mt-6 flex-1">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = item.isP2P ? pathname === "/" : pathname === item.href

            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center px-6 py-3 text-sm font-medium",
                    isActive ? "bg-slate-100 text-slate-900" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                  )}
                >
                  {item.icon ? (
                    item.icon
                  ) : (
                    <div className="h-5 w-5 flex items-center justify-center">
                      <span className="text-xs font-bold">P2P</span>
                    </div>
                  )}
                  <span className="ml-3">{item.name}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </div>
  )
}
