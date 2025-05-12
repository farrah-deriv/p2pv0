"use client"

import type React from "react"
import { ArrowLeftRight, Building2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"

interface DepositSidebarProps {
  isOpen: boolean
  onClose: () => void
  onDirectDepositClick: () => void
}

export default function DepositSidebar({ isOpen, onClose, onDirectDepositClick }: DepositSidebarProps) {
  const router = useRouter()

  const handleDirectDepositClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onClose()
    onDirectDepositClick()
  }

  const handleP2PTradingClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onClose()
    router.push("/")
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-[400px] p-0">
        <SheetHeader className="p-4 border-b border-border">
          <SheetTitle className="text-black">Deposit</SheetTitle>
        </SheetHeader>
        <div className="p-4 flex flex-col gap-4 overflow-y-auto">
          <div
            className={cn(
              "flex min-h-[56px] p-4 justify-center items-center gap-4 self-stretch",
              "rounded-xl bg-accent cursor-pointer hover:bg-accent/80",
            )}
            onClick={handleP2PTradingClick}
          >
            <div className="flex-shrink-0 w-12 h-12 bg-background rounded-full flex items-center justify-center">
              <ArrowLeftRight className="w-6 h-6 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-bold text-black leading-6 mb-1">P2P Trading</h3>
              <p className="text-muted-foreground text-sm font-normal leading-relaxed">
                Buy USD directly from other users on the P2P marketplace.
              </p>
            </div>
          </div>

          <div
            className={cn(
              "flex min-h-[56px] p-4 justify-center items-center gap-4 self-stretch",
              "rounded-xl bg-accent cursor-pointer hover:bg-accent/80",
            )}
            onClick={handleDirectDepositClick}
          >
            <div className="flex-shrink-0 w-12 h-12 bg-background rounded-full flex items-center justify-center">
              <Building2 className="w-6 h-6 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-bold text-black leading-6 mb-1">Direct deposit</h3>
              <p className="text-muted-foreground text-sm font-normal leading-relaxed">
                Deposit funds directly from your bank account, e-wallet, or other payment methods.
              </p>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
