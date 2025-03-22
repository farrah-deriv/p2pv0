import type React from "react"
import "./globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import MobileFooterNav from "@/components/mobile-footer-nav"
import Header from "@/components/header"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Buy and sell on Deriv P2P to fund your trading account | Deriv",
  description: "Buy and sell on Deriv P2P to fund your trading account | Deriv",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <div className="container mx-auto flex flex-col h-screen overflow-hidden">
            <Header className="flex-shrink-0" />
            <main className="flex-1 overflow-hidden">{children}</main>
            <MobileFooterNav className="flex-shrink-0 md:hidden" />
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}



import './globals.css'