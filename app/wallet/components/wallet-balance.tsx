"use client"

import { useState } from "react"
import { Plus, Minus, RefreshCw } from "lucide-react"
import DepositBottomSheet from "./deposit-bottom-sheet"
import DepositSidebar from "./deposit-sidebar"
import FullScreenIframeModal from "./full-screen-iframe-modal"
import { useIsMobile } from "@/lib/hooks/use-is-mobile"
import { cn } from "@/lib/utils"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"

interface WalletBalanceProps {
  className?: string
}

export default function WalletBalance({ className }: WalletBalanceProps) {
  const [isDepositSheetOpen, setIsDepositSheetOpen] = useState(false)
  const [isDepositSidebarOpen, setIsDepositSidebarOpen] = useState(false)
  const [isIframeModalOpen, setIsIframeModalOpen] = useState(false)
  const isMobile = useIsMobile()

  const handleDepositClick = () => {
    if (isMobile) {
      setIsDepositSheetOpen(true)
    } else {
      setIsDepositSidebarOpen(true)
    }
  }

  const handleDirectDepositClick = () => {
    setIsDepositSheetOpen(false)
    setIsDepositSidebarOpen(false)
    setIsIframeModalOpen(true)
  }

  return (
    <div className={cn("flex flex-col items-center justify-center py-8 ", className)}>
      <div className="mb-6">
        <Avatar className="h-14 w-14">
          <AvatarImage
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-Q9BXjRY0s9IzPF09HUb7XWcK4gIr7Q.png"
            alt="P2P Logo"
          />
          <AvatarFallback>P2P</AvatarFallback>
        </Avatar>
      </div>

      <h1 className="text-[32px] font-black text-black text-center leading-normal">0.00 USD</h1>
      <p className="mt-1 text-sm font-normal text-muted-foreground text-center leading-[22px]">P2P Wallet</p>

      <div className="mt-[50px] md:mt-12 flex w-full max-w-md justify-center md:justify-between gap-[50px] md:gap-0 px-4">
        <div className="flex flex-col items-center">
          <button
            className="flex h-14 w-14 items-center justify-center rounded-full bg-[#00D0FF] text-black hover:bg-[#00B8E6] transition-colors"
            aria-label="Deposit"
            onClick={handleDepositClick}
          >
            <Plus className="h-6 w-6" />
          </button>
          <span className="mt-2 text-sm font-normal text-[rgba(0,0,0,0.96)] text-center leading-[22px]">Deposit</span>
        </div>

        <div className="flex flex-col items-center">
          <button
            className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-[#00080A] bg-white hover:bg-gray-50 transition-colors"
            aria-label="Withdraw"
          >
            <Minus className="h-6 w-6" />
          </button>
          <span className="mt-2 text-sm font-normal text-[rgba(0,0,0,0.96)] text-center leading-[22px]">Withdraw</span>
        </div>

        <div className="flex flex-col items-center">
          <button
            className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-[#00080A] bg-white hover:bg-gray-50 transition-colors"
            aria-label="Transfer"
          >
            <RefreshCw className="h-5 w-5" />
          </button>
          <span className="mt-2 text-sm font-normal text-[rgba(0,0,0,0.96)] text-center leading-[22px]">Transfer</span>
        </div>
      </div>

      <DepositBottomSheet
        isOpen={isDepositSheetOpen}
        onClose={() => setIsDepositSheetOpen(false)}
        onDirectDepositClick={handleDirectDepositClick}
      />

      <DepositSidebar
        isOpen={isDepositSidebarOpen}
        onClose={() => setIsDepositSidebarOpen(false)}
        onDirectDepositClick={handleDirectDepositClick}
      />

      <FullScreenIframeModal isOpen={isIframeModalOpen} onClose={() => setIsIframeModalOpen(false)} />
    </div>
  )
}
