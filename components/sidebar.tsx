"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Avatar } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { MessageSquare } from "lucide-react"

export default function Sidebar() {
  const pathname = usePathname()

  const navItems = [
    { name: "Home", href: "https://hub.deriv.com/tradershub", icon: null, customIcon: "home" },
    { name: "Trade", href: "https://hub.deriv.com/tradershub/cfds", icon: null, customIcon: "trade" },
    { name: "Wallets", href: "https://hub.deriv.com/tradershub/wallets", icon: null, customIcon: "wallets" },
    { name: "P2P", href: "/", icon: MessageSquare },
  ]

  const getCustomIconPath = (iconType: string) => {
    switch (iconType) {
      case "home":
        return "/icons/home-icon.png"
      case "trade":
        return "/icons/trade-icon.svg"
      case "wallets":
        return "/icons/wallet-icon.svg"
      default:
        return ""
    }
  }

  return (
    <div className="hidden md:flex fixed left-0 top-0 bottom-0 w-[280px] flex-col border-r border-slate-200 bg-white">
      <div className="flex flex-row items-center p-4">
        <Avatar className="h-16 w-16">
          <img src="/placeholder-user.jpg" alt="User avatar" />
        </Avatar>
        <h2 className="mt-4 text-base font-medium">User</h2>
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
                  {item.customIcon ? (
                    <div className="h-5 w-5 flex items-center justify-center">
                      <Image
                        src={getCustomIconPath(item.customIcon) || "/placeholder.svg"}
                        alt={item.name}
                        width={20}
                        height={20}
                      />
                    </div>
                  ) : (
                    item.icon && <item.icon className="h-5 w-5" />
                  )}
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
