"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

interface PaymentSelectionContextType {
    selectedPaymentMethodIds: string[]
    setSelectedPaymentMethodIds: (ids: string[]) => void
    togglePaymentMethod: (id: string | number) => void
}

const PaymentSelectionContext = createContext<PaymentSelectionContextType | undefined>(undefined)

export function PaymentSelectionProvider({ children }: { children: ReactNode }) {
    const [selectedPaymentMethodIds, setSelectedPaymentMethodIds] = useState<string[]>([])

    const togglePaymentMethod = (id: string | number) => {
        const normalizedId = String(id)
        setSelectedPaymentMethodIds((prev) => {
            const isSelected = prev.includes(normalizedId)
            if (isSelected) {
                return prev.filter((methodId) => methodId !== normalizedId)
            } else if (prev.length < 3) {
                // Pin newly selected method to the top of the list.
                return [normalizedId, ...prev]
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
