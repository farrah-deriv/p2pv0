"use client"
import { X } from "lucide-react"
import DepositOptions from "./deposit-options"
import WithdrawOptions from "./withdraw-options"
import { Button } from "@/components/ui/button"

interface WalletSidebarProps {
  isOpen: boolean
  onClose: () => void
  onDirectDepositClick: () => void
  operation?: "DEPOSIT" | "WITHDRAW"
}

export default function WalletSidebar({
  isOpen,
  onClose,
  onDirectDepositClick,
  operation = "DEPOSIT",
}: WalletSidebarProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex justify-end" onClick={onClose}>
      <div className="bg-background h-full w-[400px] flex flex-col shadow-lg" onClick={(e) => e.stopPropagation()}>
        <div className="p-4 flex justify-between items-center border-b border-border">
          <h2 className="overflow-hidden text-black truncate text-xl font-bold leading-[30px]">
            {operation === "DEPOSIT" ? "Deposit" : "Withdraw"}
          </h2>
          <Button
            onClick={onClose}
            variant="ghost"
            className="p-1 bg-white hover:bg-white text-black"
            size="sm"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-4 flex flex-col gap-4 overflow-y-auto">
          {operation === "DEPOSIT" ? (
            <DepositOptions onClose={onClose} onDirectDepositClick={onDirectDepositClick} />
          ) : (
            <WithdrawOptions onClose={onClose} onDirectWithdrawClick={onDirectDepositClick} />
          )}
        </div>
      </div>
    </div>
  )
}
