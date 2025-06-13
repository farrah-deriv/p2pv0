"use client"

import type React from "react"

import { useEffect, useState } from "react"
import "./globals.css"
import { usePathname, useRouter } from "next/navigation"
import MobileFooterNav from "@/components/mobile-footer-nav"
import Header from "@/components/header"
import Sidebar from "@/components/sidebar"

export default function Main({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const pathname = usePathname()
  const router = useRouter()
  const [isHeaderVisible, setIsHeaderVisible] = useState(false)

  useEffect(() => {
    const PUBLIC_ROUTES = ["/login"]
    const token = localStorage.getItem("auth_token")
    const isPublic = PUBLIC_ROUTES.includes(pathname)

    if (!token && !isPublic) {
      setIsHeaderVisible(false)
      router.push("/login")
    }

    if (token) {
      setIsHeaderVisible(true)
      router.push(pathname)
    }
  }, [pathname, router])

  return (
    <>
      {/* Desktop layout with sidebar */}
      <div className="hidden md:block">
        <Sidebar />
        {isHeaderVisible && <Header />}
        <div className="pl-[280px] min-h-screen">
          <div className="container mx-auto p-4">{children}</div>
        </div>
      </div>

      {/* Mobile layout (unchanged) */}
      <div className="md:hidden container mx-auto flex flex-col h-screen overflow-hidden">
        {isHeaderVisible && <Header className="flex-shrink-0" />}
        <main className="flex-1 overflow-hidden">{children}</main>
        <MobileFooterNav className="flex-shrink-0" />
      </div>
    </>
  )
}
