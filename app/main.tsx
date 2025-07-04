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

  if (pathname === "/login") {
    return <div className="container mx-auto overflow-hidden max-w-[1232px]">{children}</div>
  }

  return (
    <>
      <div className="hidden md:flex p-6 h-screen overflow-hidden m-auto max-w-[1232px]">
        {isHeaderVisible && <Sidebar />}
        <div className="flex-1">{isHeaderVisible && <Header />}
          <div className="container mx-auto p-4 h-[calc(100%-2rem)]">{children}</div>
        </div>
      </div>
      <div className="md:hidden container mx-auto p-4 flex flex-col h-screen overflow-hidden">
        {isHeaderVisible && <Header className="flex-shrink-0" />}
        <main className="flex-1 overflow-hidden">{children}</main>
        <MobileFooterNav className="flex-shrink-0" />
      </div>
    </>
  )
}
