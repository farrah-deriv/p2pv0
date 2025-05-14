"use client"
import { X } from "lucide-react"
import DepositOptions from "./deposit-options"

interface DepositSidebarProps {
  isOpen: boolean
  onClose: () => void
  onDirectDepositClick: () => void
}

export default function DepositSidebar({ isOpen, onClose, onDirectDepositClick }: DepositSidebarProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex justify-end" onClick={onClose}>
      <div className="bg-background h-full w-[400px] flex flex-col shadow-lg" onClick={(e) => e.stopPropagation()}>
        <div className="p-4 flex justify-between items-center border-b border-border">
          <h2 className="overflow-hidden text-black truncate text-xl font-bold leading-[30px]">Deposit</h2>
          <div
            onClick={onClose}
            className="p-1 rounded-full hover:bg-accent cursor-pointer w-12 h-12 flex items-center justify-center"
            aria-label="Close"
            role="button"
            tabIndex={0}
          >
            <X className="w-6 h-6" />
          </div>
        </div>

        <div className="p-4 flex flex-col gap-4 overflow-y-auto">
          <DepositOptions onClose={onClose} onDirectDepositClick={onDirectDepositClick} />
        </div>
      </div>
    </div>
  )
}
