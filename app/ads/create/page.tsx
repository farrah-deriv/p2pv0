"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { AdDetailsForm } from "../components/ad-details-form"
import { PaymentDetailsForm } from "../components/payment-details-form"
import { ProgressSteps } from "../components/progress-steps"
import { createAd, getCurrencies } from "../api/api-ads"
import { getPaymentMethods } from "@/app/profile/api/api-payment-methods"
import type { CreateAdPayload, PaymentMethod } from "../types"
import { toast } from "@/hooks/use-toast"

interface AdFormData {
  type: "buy" | "sell"
  currency: string
  amount: string
  minOrder: string
  maxOrder: string
  rate: string
  paymentMethods: string[]
  instructions: string
}

export default function CreateAdPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [currencies, setCurrencies] = useState<string[]>([])
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [formData, setFormData] = useState<AdFormData>({
    type: "buy",
    currency: "USD",
    amount: "",
    minOrder: "",
    maxOrder: "",
    rate: "",
    paymentMethods: [],
    instructions: "",
  })

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [currenciesData, paymentMethodsData] = await Promise.all([getCurrencies(), getPaymentMethods()])
        setCurrencies(currenciesData)
        setPaymentMethods(paymentMethodsData)
      } catch (error) {
        console.error("Failed to load initial data:", error)
      }
    }

    loadInitialData()
  }, [])

  const handleNext = () => {
    if (currentStep < 2) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async () => {
    setIsLoading(true)
    try {
      const payload: CreateAdPayload = {
        type: formData.type,
        payment_currency: formData.currency,
        total_amount: Number.parseFloat(formData.amount),
        minimum_order_amount: Number.parseFloat(formData.minOrder),
        maximum_order_amount: Number.parseFloat(formData.maxOrder),
        exchange_rate: Number.parseFloat(formData.rate),
        payment_method_names: formData.paymentMethods,
        description: formData.instructions,
        is_active: true,
      }

      const result = await createAd(payload)

      if (result.success) {
        toast({
          title: "Success",
          description: "Your ad has been created successfully!",
        })
        router.push("/ads/my-ads")
      } else {
        const errorMessage = result.errors?.[0]?.message || "Failed to create ad"
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const updateFormData = (updates: Partial<AdFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }))
  }

  const isStep1Valid = () => {
    return (
      formData.type &&
      formData.currency &&
      formData.amount &&
      formData.minOrder &&
      formData.maxOrder &&
      formData.rate &&
      Number.parseFloat(formData.amount) > 0 &&
      Number.parseFloat(formData.minOrder) > 0 &&
      Number.parseFloat(formData.maxOrder) > 0 &&
      Number.parseFloat(formData.rate) > 0 &&
      Number.parseFloat(formData.minOrder) <= Number.parseFloat(formData.maxOrder)
    )
  }

  const isStep2Valid = () => {
    return formData.paymentMethods.length > 0
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-4 p-0 h-auto font-normal text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <h1 className="text-3xl font-bold">Create Advertisement</h1>
        <p className="text-muted-foreground mt-2">Set up your buy or sell advertisement</p>
      </div>

      <ProgressSteps currentStep={currentStep} totalSteps={2} />

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>{currentStep === 1 ? "Ad Details" : "Payment Methods"}</CardTitle>
        </CardHeader>
        <CardContent>
          {currentStep === 1 ? (
            <AdDetailsForm formData={formData} currencies={currencies} onUpdate={updateFormData} />
          ) : (
            <PaymentDetailsForm formData={formData} paymentMethods={paymentMethods} onUpdate={updateFormData} />
          )}

          <div className="flex justify-between mt-8">
            <Button variant="outline" onClick={handleBack} disabled={currentStep === 1}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>

            {currentStep === 1 ? (
              <Button onClick={handleNext} disabled={!isStep1Valid()}>
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={!isStep2Valid() || isLoading}>
                {isLoading ? "Creating..." : "Create Ad"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
