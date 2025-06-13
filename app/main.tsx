"use client"

import type React from "react"

import { usePathname } from "next/navigation"
import Header from "@/components/header"
import Sidebar from "@/components/sidebar"

export default function Main({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isLoginPage = pathname === "/login"

  if (isLoginPage) {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <Header />
      <main className="pl-[280px] pt-16 min-h-screen">
        <div className="container mx-auto p-4">{children}</div>
      </main>
    </div>
  )
}
