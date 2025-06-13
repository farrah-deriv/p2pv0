import type React from "react"
import Header from "@/components/header"
import Sidebar from "@/components/sidebar"
import MarketNavigation from "@/components/market-navigation"
import MobileFooterNav from "@/components/mobile-footer-nav"

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-white">
      <Sidebar />
      <Header />
      <MarketNavigation />
      <main className="md:pl-[280px] md:pt-[144px] pt-0">{children}</main>
      <MobileFooterNav />
    </div>
  )
}
