"use client"

import type React from "react"
import { ArrowLeftRight, Building2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

interface WithdrawOptionProps {
    onClose: () => void
    onDirectWithdrawClick: () => void
}

export default function WithdrawOptions({ onClose, onDirectWithdrawClick }: WithdrawOptionProps) {
    const router = useRouter()

    const handleDirectWithdrawClick = (e: React.MouseEvent) => {
        e.stopPropagation()
        onClose()
        onDirectWithdrawClick()
    }

    const handleMarketplaceClick = (e: React.MouseEvent) => {
        e.stopPropagation()
        onClose()
        router.push("/")
    }

    return (
        <>
            <div
                className={cn(
                    "flex min-h-[56px] p-4 justify-center items-center gap-4 self-stretch",
                    "rounded-xl bg-accent cursor-pointer hover:bg-accent/80",
                )}
                onClick={handleMarketplaceClick}
            >
                <div className="flex-shrink-0 w-12 h-12 bg-background rounded-full flex items-center justify-center">
                    <ArrowLeftRight className="w-6 h-6 text-muted-foreground" />
                </div>
                <div className="flex-1">
                    <h3 className="text-base font-bold text-black leading-6 mb-1">Marketplace</h3>
                    <p className="text-muted-foreground text-sm font-normal leading-[22px]">
                        Trade USD directly with other users on the marketplace.
                    </p>
                </div>
            </div>

            <div
                className={cn(
                    "flex min-h-[56px] p-4 justify-center items-center gap-4 self-stretch",
                    "rounded-xl bg-accent cursor-pointer hover:bg-accent/80",
                )}
                onClick={handleDirectWithdrawClick}
            >
                <div className="flex-shrink-0 w-12 h-12 bg-background rounded-full flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-muted-foreground" />
                </div>
                <div className="flex-1">
                    <h3 className="text-base font-bold text-black leading-6 mb-1">Direct withdrawal</h3>
                    <p className="text-muted-foreground text-sm font-normal leading-[22px]">
                        Withdraw funds directly to your bank account, e-wallet, or other payment methods.
                    </p>
                </div>
            </div>
        </>
    )
}
