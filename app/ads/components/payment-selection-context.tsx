"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

interface PaymentSelectionContextType {
    selectedPaymentMethodIds: number[]
    setSelectedPaymentMethodIds: (ids: number[]) => void
    togglePaymentMethod: (id: number) => void
}

const PaymentSelectionContext = createContext<PaymentSelectionContextType | undefined>(undefined)

export function PaymentSelectionProvider({ children }: { children: ReactNode }) {
    const [selectedPaymentMethodIds, setSelectedPaymentMethodIds] = useState<number[]>([])

    const togglePaymentMethod = (id: number) => {
        setSelectedPaymentMethodIds((prev) => {
            const isSelected = prev.includes(id)
            if (isSelected) {
                return prev.filter((methodId) => methodId !== id)
            } else if (prev.length < 3) {
                return [...prev, id]
            }
            return prev
        })
    }

    return (
        <PaymentSelectionContext.Provider
            value={{
                selectedPaymentMethodIds,
                setSelectedPaymentMethodIds,
                togglePaymentMethod,
            }}
        >
            {children}
        </PaymentSelectionContext.Provider>
    )
}

export function usePaymentSelection() {
    const context = useContext(PaymentSelectionContext)
    if (context === undefined) {
        throw new Error("usePaymentSelection must be used within a PaymentSelectionProvider")
    }
    return context
}
