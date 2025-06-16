"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Avatar } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

export default function Sidebar() {
  const pathname = usePathname()

  const navItems = [
    { name: "Home", href: "https://hub.deriv.com/tradershub", icon: "/icons/home-icon.png" },
    { name: "Trade", href: "https://hub.deriv.com/tradershub/cfds", icon: "/icons/trade-icon.svg" },
    { name: "Wallets", href: "https://hub.deriv.com/tradershub/wallets", icon: "/icons/wallet-icon.svg" },
    { name: "P2P", href: "/", icon: "/icons/p2p-icon.svg" },
  ]

  return (
    <div className="hidden md:flex fixed left-0 top-0 bottom-0 w-[280px] flex-col border-r border-slate-200 bg-white">
      <div className="flex flex-row items-center p-6 gap-4">
        <Avatar className="h-8 w-8">
          <Image src="/icons/default-user-icon.svg" alt="User avatar" width={64} height={64} />
        </Avatar>
        <h2 className="text-base font-medium">User</h2>
      </div>
      <nav className="flex-1 px-4 pt-4">
        <ul className="space-y-2">
          {navItems.map((item) => {
            const isActive = item.href === pathname

            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md p-4 text-sm",
                    isActive ? "bg-slate-100 text-slate-900" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                  )}
                >
                  <div className="h-5 w-5 flex items-center justify-center">
                    <Image src={item.icon} alt={item.name} width={20} height={20} />
                  </div>
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
