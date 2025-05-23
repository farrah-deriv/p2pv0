"use client"

import { X, Info } from "lucide-react"
import { Button } from "@/components/ui/button"

interface BalanceInfoPopupProps {
  isOpen: boolean
  onClose: () => void
}

export default function BalanceInfoPopup({ isOpen, onClose }: BalanceInfoPopupProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 relative">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold">Deriv P2P balance</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-6">
          <p className="text-lg font-bold mb-4">Your Deriv P2P balance only contains:</p>
          <ul className="space-y-4 list-disc pl-6">
            <li className="text-md">Funds you receive from buying/selling USD on Deriv P2P.</li>
            <li className="text-md">Deposits you made through non-reversible payment methods.</li>
          </ul>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg mb-6 flex">
          <Info className="h-6 w-6 text-blue-500 flex-shrink-0 mr-2 mt-1" />
          <p className="text-sm">
            Note: Funds deposited using reversible payment methods, like credit cards, Maestro, Diners Club, ZingPay,
            Skrill, Neteller, Ozow, and UPI QR, will not appear in your P2P balance.
          </p>
        </div>

        <Button onClick={onClose} className="w-full" size="sm">
          OK
        </Button>
      </div>
    </div>
  )
}
