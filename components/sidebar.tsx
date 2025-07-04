"use client"

import Link from "next/link"
import Image from "next/image"
import { USER } from "@/lib/local-variables"
import { Avatar } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

export default function Sidebar() {
  const navItems = [
    { name: "Home", href: "https://app.champion.trade/champion", icon: "/icons/home-icon.png" },
    { name: "Trade", href: "https://app.champion.trade/trade", icon: "/icons/trade-icon.svg" },
    { name: "Wallets", href: "https://app.champion.trade/champion", icon: "/icons/wallet-icon.svg" },
    { name: "P2P", href: "/", icon: "/icons/p2p-icon.svg" },
  ]

  return (
    <div className="hidden md:flex w-[295px] flex-col border-r border-slate-200">
      <div className="flex flex-row items-center p-6 gap-4">
        <Avatar className="h-8 w-8">
          <Image src="/icons/default-user-icon.svg" alt="User avatar" width={64} height={64} />
        </Avatar>
        <h2 className="text-sm font-bold text-slate-1400">{USER.nickname}</h2>
      </div>
      <nav className="flex-1 px-4">
        <ul>
          {navItems.map((item) => {
            const isActive = item.name === "P2P"

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
