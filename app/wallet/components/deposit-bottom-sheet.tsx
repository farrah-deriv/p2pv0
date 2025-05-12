"use client"
import { X } from "lucide-react"
import DepositOptions from "./deposit-options"

interface DepositBottomSheetProps {
  isOpen: boolean
  onClose: () => void
  onDirectDepositClick: () => void
}

export default function DepositBottomSheet({ isOpen, onClose, onDirectDepositClick }: DepositBottomSheetProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/50" onClick={onClose}>
      <div className="absolute bottom-0 left-0 right-0 bg-background rounded-t-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-center pt-2 pb-1">
          <div className="w-12 h-1 bg-muted rounded-full"></div>
        </div>

        <div className="p-4 pb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="overflow-hidden text-black truncate text-xl font-bold leading-[30px]">Deposit</h2>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-accent" aria-label="Close">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-4">
            <DepositOptions onClose={onClose} onDirectDepositClick={onDirectDepositClick} />
          </div>
        </div>
      </div>
    </div>
  )
}
