import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import Main from "./main";
import "./globals.css"

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
          <Main children={children} />
        </ThemeProvider>
      </body>
    </html>
  )
}
