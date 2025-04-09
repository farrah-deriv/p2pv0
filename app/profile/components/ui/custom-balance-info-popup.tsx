"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"

interface CustomBalanceInfoPopupProps {
  isOpen: boolean
  onClose: () => void
}

export default function CustomBalanceInfoPopup({ isOpen, onClose }: CustomBalanceInfoPopupProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>P2P Balance Information</DialogTitle>
          <DialogDescription>Your P2P balance is the amount available for peer-to-peer trading.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <h3 className="font-medium">Available Balance</h3>
            <p className="text-sm text-slate-500">
              This is the amount you can use for buying or selling in P2P transactions.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-medium">Pending Transactions</h3>
            <p className="text-sm text-slate-500">
              Funds that are currently locked in ongoing transactions will not be reflected in your available balance.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-medium">Adding Funds</h3>
            <p className="text-sm text-slate-500">
              You can add funds to your P2P balance from your main wallet or through deposits.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
