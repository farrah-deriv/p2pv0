"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import { ProgressSteps } from "../components/progress-steps"
import { AdDetailsForm } from "../components/ad-details-form"
import { PaymentDetailsForm } from "../components/payment-details-form"
import { createAd, getCurrencies } from "../api/api-ads"
import { getPaymentMethods } from "@/app/profile/api/api-payment-methods"
import type { CreateAdPayload, MyAd } from "../types"
import type { PaymentMethod } from "@/app/profile/api/api-payment-methods"

export default function CreateAdPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const editId = searchParams.get("edit")

  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [currencies, setCurrencies] = useState<string[]>([])
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingAd, setEditingAd] = useState<MyAd | null>(null)

  const [formData, setFormData] = useState({
    type: "buy" as "buy" | "sell",
    currency: "USD",
    totalAmount: "",
    minOrder: "",
    maxOrder: "",
    exchangeRate: "",
    instructions: "",
    paymentMethods: [] as string[],
  })

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [currenciesData, paymentMethodsData] = await Promise.all([getCurrencies(), getPaymentMethods()])

        setCurrencies(currenciesData)
        setPaymentMethods(paymentMethodsData)

        if (editId) {
          setIsEditMode(true)
        }
      } catch (error) {
        console.error("Error loading initial data:", error)
      }
    }

    loadInitialData()
  }, [editId])

  const handleNext = () => {
    if (currentStep < 2) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    } else {
      router.push("/ads/my-ads")
    }
  }

  const handleFormDataChange = (newData: Partial<typeof formData>) => {
    setFormData((prev) => ({ ...prev, ...newData }))
  }

  const handleSubmit = async () => {
    setIsLoading(true)

    try {
      const payload: CreateAdPayload = {
        type: formData.type,
        payment_currency: formData.currency,
        total_amount: Number.parseFloat(formData.totalAmount),
        minimum_order_amount: Number.parseFloat(formData.minOrder),
        maximum_order_amount: Number.parseFloat(formData.maxOrder),
        exchange_rate: Number.parseFloat(formData.exchangeRate),
        description: formData.instructions,
        payment_method_names: formData.paymentMethods,
      }

      const result = await createAd(payload)

      if (result.success) {
        router.push("/ads/my-ads?created=true")
      } else {
        console.error("Failed to create ad:", result.errors)
      }
    } catch (error) {
      console.error("Error creating ad:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={handleBack} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">{isEditMode ? "Edit Advertisement" : "Create Advertisement"}</h1>
        </div>

        <ProgressSteps currentStep={currentStep} totalSteps={2} />

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>{currentStep === 1 ? "Ad Details" : "Payment Methods"}</CardTitle>
          </CardHeader>
          <CardContent>
            {currentStep === 1 ? (
              <AdDetailsForm
                formData={formData}
                currencies={currencies}
                onChange={handleFormDataChange}
                onNext={handleNext}
                isEditMode={isEditMode}
                editingAd={editingAd}
              />
            ) : (
              <PaymentDetailsForm
                formData={formData}
                paymentMethods={paymentMethods}
                onChange={handleFormDataChange}
                onBack={handleBack}
                onSubmit={handleSubmit}
                isLoading={isLoading}
                isEditMode={isEditMode}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
