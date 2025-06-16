"use client"

import { useState, useEffect } from "react"
import { Plus, Minus, RefreshCw } from "lucide-react"
import Image from "next/image"
import DepositBottomSheet from "./deposit-bottom-sheet"
import DepositSidebar from "./deposit-sidebar"
import FullScreenIframeModal from "./full-screen-iframe-modal"
import { useIsMobile } from "@/lib/hooks/use-is-mobile"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { USER, API, AUTH } from "@/lib/local-variables"

interface WalletBalanceProps {
  className?: string
}

type OperationType = "DEPOSIT" | "WITHDRAW"

export default function WalletBalance({ className }: WalletBalanceProps) {
  const [isDepositSheetOpen, setIsDepositSheetOpen] = useState(false)
  const [isDepositSidebarOpen, setIsDepositSidebarOpen] = useState(false)
  const [isWithdrawSheetOpen, setIsWithdrawSheetOpen] = useState(false)
  const [isWithdrawSidebarOpen, setIsWithdrawSidebarOpen] = useState(false)
  const [isIframeModalOpen, setIsIframeModalOpen] = useState(false)
  const [currentOperation, setCurrentOperation] = useState<OperationType>("DEPOSIT")
  const [balance, setBalance] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const isMobile = useIsMobile()

  const fetchBalance = async () => {
    try {
      setIsRefreshing(true)

      const userId = USER.id
      const url = `${API.baseUrl}/users/${userId}`

      const response = await fetch(url, {
        headers: {
          ...AUTH.getAuthHeader(),
          accept: "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch user data: ${response.status} ${response.statusText}`)
      }

      const responseData = await response.json()

      if (responseData && responseData.data) {
        const data = responseData.data
        setBalance(data.balances?.USD?.amount ? Number.parseFloat(data.balances.USD.amount) : 0)
      }

      setIsLoading(false)
    } catch (error) {
      console.error("Error fetching user balance:", error)
      setIsLoading(false)
    } finally {
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    fetchBalance()
  }, [])

  const handleRefresh = () => {
    fetchBalance()
  }

  const handleDepositClick = () => {
    setCurrentOperation("DEPOSIT")
    if (isMobile) {
      setIsDepositSheetOpen(true)
    } else {
      setIsDepositSidebarOpen(true)
    }
  }

  const handleWithdrawClick = () => {
    setCurrentOperation("WITHDRAW")
    if (isMobile) {
      setIsWithdrawSheetOpen(true)
    } else {
      setIsWithdrawSidebarOpen(true)
    }
  }

  const handleDirectDepositClick = () => {
    setIsDepositSheetOpen(false)
    setIsDepositSidebarOpen(false)
    setCurrentOperation("DEPOSIT")
    setIsIframeModalOpen(true)
  }

  const handleDirectWithdrawClick = () => {
    setIsWithdrawSheetOpen(false)
    setIsWithdrawSidebarOpen(false)
    setCurrentOperation("WITHDRAW")
    setIsIframeModalOpen(true)
  }

  return (
    <div className={cn("flex flex-col items-center justify-center py-8", className)}>
      <div className="mb-6 h-14 w-14">
        <Image
          src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-Q9BXjRY0s9IzPF09HUb7XWcK4gIr7Q.png"
          alt="P2P Logo"
          width={56}
          height={56}
          className="rounded-full"
        />
      </div>

      <div className="flex items-center justify-center gap-2">
        <h1 className="text-[32px] font-black text-black text-center leading-normal">
          {isLoading ? "Loading..." : `${Number(balance).toFixed(2)} USD`}
        </h1>
        <Button variant="ghost" size="sm" onClick={handleRefresh} aria-label="Refresh balance">
          <RefreshCw className={cn("h-4 w-4 text-gray-400", isRefreshing && "animate-spin")} />
        </Button>
      </div>
      <p className="mt-1 text-sm font-normal text-muted-foreground text-center leading-[22px]">P2P Wallet</p>

      <div className="mt-[50px] md:mt-12 flex w-full max-w-md justify-center md:justify-between gap-[50px] md:gap-0 px-4">
        <div className="flex flex-col items-center">
          <Button
            size="icon"
            className="h-14 w-14 !rounded-full rounded-[9999px] aspect-square overflow-hidden flex-shrink-0 min-h-[56px] min-w-[56px] max-h-[56px] max-w-[56px] bg-[#00D0FF] text-black hover:bg-[#00B8E6] transition-colors p-0"
            aria-label="Deposit"
            onClick={handleDepositClick}
          >
            <Plus className="h-6 w-6" />
          </Button>
          <span className="mt-2 text-sm font-normal text-[rgba(0,0,0,0.96)] text-center leading-[22px]">Deposit</span>
        </div>

        <div className="flex flex-col items-center">
          <Button
            variant="outline"
            size="icon"
            className="h-14 w-14 !rounded-full rounded-[9999px] aspect-square overflow-hidden flex-shrink-0 min-h-[56px] min-w-[56px] max-h-[56px] max-w-[56px] border-2 border-[#00080A] bg-white hover:bg-gray-50 transition-colors p-0"
            aria-label="Withdraw"
            onClick={handleWithdrawClick}
          >
            <Minus className="h-6 w-6" />
          </Button>
          <span className="mt-2 text-sm font-normal text-[rgba(0,0,0,0.96)] text-center leading-[22px]">Withdraw</span>
        </div>

        <div className="flex flex-col items-center">
          <Button
            variant="outline"
            size="icon"
            className="h-14 w-14 !rounded-full rounded-[9999px] aspect-square overflow-hidden flex-shrink-0 min-h-[56px] min-w-[56px] max-h-[56px] max-w-[56px] border-2 border-[#00080A] bg-white hover:bg-gray-50 transition-colors p-0"
            aria-label="Transfer"
          >
            <RefreshCw className="h-5 w-5" />
          </Button>
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

      <DepositBottomSheet
        isOpen={isWithdrawSheetOpen}
        onClose={() => setIsWithdrawSheetOpen(false)}
        onDirectDepositClick={handleDirectWithdrawClick}
      />

      <DepositSidebar
        isOpen={isWithdrawSidebarOpen}
        onClose={() => setIsWithdrawSidebarOpen(false)}
        onDirectDepositClick={handleDirectWithdrawClick}
      />

      <FullScreenIframeModal
        isOpen={isIframeModalOpen}
        onClose={() => setIsIframeModalOpen(false)}
        operation={currentOperation}
      />
    </div>
  )
}

