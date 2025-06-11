"use client"

import Link from "next/link"
import Image from "next/image"
import { User, LogOut } from "lucide-react"
import { cn } from "@/lib/utils"
import { NovuNotifications } from "./novu-notifications"
import { Button } from "@/components/ui/button"
import { logout } from "@/services/api/api-auth"
import { useRouter } from "next/navigation"

export default function Header() {
  const router = useRouter()
  const navItems = [
    { name: "Hub", href: "https://hub.deriv.com/tradershub/home" },
    { name: "CFDs", href: "https://hub.deriv.com/tradershub/cfds" },
    { name: "Options", href: "https://hub.deriv.com/tradershub/options" },
    { name: "Wallets", href: "/wallet" },
  ]

  const handleSignOut = async () => {
    await logout()
    router.push("/login")
  }

  return (
    <header className="hidden md:block fixed top-0 left-0 right-0 bg-white border-b border-slate-200 z-10 h-16">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="flex items-center mr-8">
              <Image
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/brand%20-%20logo-telmDxrgpE2VJRbT0G4BSNOlaMSaDr.png"
                alt="Deriv Logo"
                width={36}
                height={36}
                className="h-9 w-auto"
              />
            </Link>
            <nav className="hidden md:flex">
              <ul className="flex space-x-8">
                {navItems.map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={cn(
                        "inline-flex h-16 items-center border-b-2 px-1 text-sm",
                        item.name === "Wallets"
                          ? "text-slate-1400 border-[#00D0FF] font-bold"
                          : "border-transparent text-slate-600 hover:border-slate-300 hover:text-slate-700",
                      )}
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-slate-600 hover:text-slate-700">
              <NovuNotifications />
            </div>
            <Link href="/profile" className="text-slate-600 hover:text-slate-700">
              <User className="h-5 w-5" />
            </Link>
            <Button variant="outline" size="sm" onClick={handleSignOut} className="flex items-center gap-2">
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
