"use client"

import Link from "next/link"
import Image from "next/image"
import { User } from "lucide-react"
import { cn } from "@/lib/utils"
import { usePathname } from "next/navigation"

export default function Header() {
  const pathname = usePathname()

  const navItems = [
    { name: "Hub", href: "https://hub.deriv.com/tradershub/home" },
    { name: "CFDs", href: "https://hub.deriv.com/tradershub/cfds" },
    { name: "Options", href: "https://hub.deriv.com/tradershub/options" },
    { name: "Wallets", href: "/" },
  ]

  return (
    <header className="hidden md:block fixed top-0 left-0 right-0 bg-white border-b border-slate-200">
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
            <Link href="/profile" className="text-slate-600 hover:text-slate-700">
              <User className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}

