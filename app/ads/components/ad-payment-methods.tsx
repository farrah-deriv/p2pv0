"use client"

import { useState, useEffect } from "react"
import { API, AUTH } from "@/lib/local-variables"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { CustomShimmer } from "@/app/profile/components/ui/custom-shimmer"

interface PaymentMethod {
    id: number
    method: string
    type: string
    display_name: string
    fields: Record<string, any>
    created_at?: number
    is_default?: boolean
}

const AdPaymentMethods = () => {
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
    const [selectedMethods, setSelectedMethods] = useState<number[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const fetchPaymentMethods = async () => {
            try {
                const url = `${API.baseUrl}${API.endpoints.userPaymentMethods}`
                const headers = {
                    ...AUTH.getAuthHeader(),
                    "Content-Type": "application/json",
                }

                const response = await fetch(url, {
                    headers,
                    cache: "no-store",
                })

                if (response.ok) {
                    const data = await response.json()
                    setPaymentMethods(data.data || [])
                }
            } catch (error) {
                console.log(error);
                // Silently fail - just show empty state
            } finally {
                setIsLoading(false)
            }
        }

        fetchPaymentMethods()
    }, [])

    useEffect(() => {
        ; (window as any).adPaymentMethodIds = selectedMethods
    }, [selectedMethods])

    const handleCheckboxChange = (methodId: number, checked: boolean) => {
        if (checked && selectedMethods.length >= 3) {
            return
        }

        const newSelection = checked ? [...selectedMethods, methodId] : selectedMethods.filter((id) => id !== methodId)
        setSelectedMethods(newSelection)
    }

    const getMethodDisplayDetails = (method: PaymentMethod) => {
        if (method.type === "bank") {
            const account = method.fields.account?.value || ""
            const bankName = method.fields.bank_name?.value || "Bank Transfer"
            const maskedAccount = account ? account.slice(0, 6) + "****" + account.slice(-4) : "****"

            return {
                primary: maskedAccount,
                secondary: bankName,
            }
        } else {
            const account = method.fields.account?.value || ""
            const displayValue = account || method.display_name

            return {
                primary: displayValue,
                secondary: method.display_name,
            }
        }
    }

    const getMethodIcon = (method: PaymentMethod) => {
        if (method.type === "bank") {
            return <div className="w-3 h-3 rounded-full bg-green-500"></div>
        } else {
            return <div className="w-3 h-3 rounded-full bg-blue-500"></div>
        }
    }

    const getCategoryDisplayName = (type: string) => {
        switch (type) {
            case "bank":
                return "Bank transfer"
            case "ewallet":
                return "eWallet"
            default:
                return "Other"
        }
    }

    if (isLoading) {
        return (
            <div className="space-y-4">
                <div className="space-y-2">
                    <CustomShimmer className="h-6 w-48" />
                    <CustomShimmer className="h-4 w-64" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <CustomShimmer className="h-24 w-full" />
                    <CustomShimmer className="h-24 w-full" />
                    <CustomShimmer className="h-24 w-full" />
                </div>
            </div>
        )
    }

    return (
        <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Select payment method</h3>
            <p className="text-gray-600 mb-4">You can select up to 3 payment methods</p>

            <div className="md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-4">
                <div className="flex gap-4 overflow-x-auto pb-2 md:contents">
                    {paymentMethods.map((method) => {
                        const isSelected = selectedMethods.includes(method.id)
                        const displayDetails = getMethodDisplayDetails(method)

                        return (
                            <Card
                                key={method.id}
                                className="cursor-pointer transition-all duration-200 bg-gray-100 border-0 hover:shadow-md flex-shrink-0 w-64 md:w-auto"
                            >
                                <CardContent className="p-4">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            {getMethodIcon(method)}
                                            <span className="font-medium text-gray-700">{getCategoryDisplayName(method.type)}</span>
                                        </div>
                                        <Checkbox
                                            checked={isSelected}
                                            onCheckedChange={(checked) => handleCheckboxChange(method.id, !!checked)}
                                            className={`border-0 transition-colors ${isSelected ? "bg-cyan-500 text-white" : "bg-white"}`}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <div className="font-medium text-gray-900">{displayDetails.primary}</div>
                                        <div className="text-sm text-gray-500">{displayDetails.secondary}</div>
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            </div>

            {paymentMethods.length === 0 && <p className="text-gray-500 italic">No payment methods are added yet</p>}
        </div>
    )
}

export default AdPaymentMethods
