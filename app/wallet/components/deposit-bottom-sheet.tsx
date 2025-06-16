"use client"
import { X } from "lucide-react"
import DepositOptions from "./deposit-options"
import WithdrawOptions from "./withdraw-options"
import { Button } from "@/components/ui/button"

interface DepositBottomSheetProps {
  isOpen: boolean
  onClose: () => void
  onDirectDepositClick: () => void
  operation?: "DEPOSIT" | "WITHDRAW"
}

export default function DepositBottomSheet({
  isOpen,
  onClose,
  onDirectDepositClick,
  operation = "DEPOSIT",
}: DepositBottomSheetProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/50" onClick={onClose}>
      <div className="absolute bottom-0 left-0 right-0 bg-background rounded-t-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-center pt-2 pb-1">
          <div className="w-12 h-1 bg-muted rounded-full"></div>
        </div>

        <div className="p-4 pb-8">
          <div className="flex justify-between items-center mb-6">
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

          <div className="space-y-4">
            {operation === "DEPOSIT" ? (
              <DepositOptions onClose={onClose} onDirectDepositClick={onDirectDepositClick} />
            ) : (
              <WithdrawOptions onClose={onClose} onDirectWithdrawClick={onDirectDepositClick} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
