"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import MobileFooterNav from "@/components/mobile-footer-nav"
import Header from "@/components/header"
import Sidebar from "@/components/sidebar"
import * as AuthAPI from "@/services/api/api-auth"
import "./globals.css"

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
    const isPublic = PUBLIC_ROUTES.includes(pathname)

    const fetchSessionData = async () => {
      try {
        const response = await AuthAPI.getSession()
        if (response.errors && !isPublic) {
          setIsHeaderVisible(false)
          router.push("/login")
        } else {
          setIsHeaderVisible(true)
          router.push(pathname)
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchSessionData();
  }, [pathname, router])

  if (pathname === "/login") {
    return <div className="container mx-auto overflow-hidden max-w-[1232px]">{children}</div>
  }

  return (
    <>
      <div className="hidden md:flex p-6 h-screen overflow-hidden m-auto max-w-[1232px]">
        {isHeaderVisible && <Sidebar />}
        <div className="flex-1">{isHeaderVisible && <Header />}
          <div className="container mx-auto p-4">{children}</div>
        </div>
      </div>
      <div className="md:hidden container mx-auto p-4 h-[calc(100%-2rem)]">
        {isHeaderVisible && <Header className="flex-shrink-0" />}
        <main className="flex-1 overflow-hidden">{children}</main>
        <MobileFooterNav className="flex-shrink-0" />
      </div>
    </>
  )
}
