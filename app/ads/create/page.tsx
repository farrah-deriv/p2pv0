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
import type { CreateAdPayload } from "../types"
import { toast } from "@/hooks/use-toast"

interface FormData {
  type: "buy" | "sell"
  currency: string
  amount: string
  rate: string
  minOrder: string
  maxOrder: string
  paymentMethods: string[]
  instructions: string
}

export default function CreateAdPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [currencies, setCurrencies] = useState<string[]>([])
  const [paymentMethods, setPaymentMethods] = useState<any[]>([])
  const [formData, setFormData] = useState<FormData>({
    type: "buy",
    currency: "USD",
    amount: "",
    rate: "",
    minOrder: "",
    maxOrder: "",
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

  const handlePrevious = () => {
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
        available_amount: Number.parseFloat(formData.amount),
        exchange_rate: Number.parseFloat(formData.rate),
        minimum_order_amount: Number.parseFloat(formData.minOrder),
        maximum_order_amount: Number.parseFloat(formData.maxOrder),
        payment_method_names: formData.paymentMethods,
        description: formData.instructions,
      }

      const result = await createAd(payload)

      if (result.success) {
        toast({
          title: "Success",
          description: "Advertisement created successfully!",
        })
        router.push("/ads/my-ads")
      } else {
        const errorMessage = result.errors?.[0]?.message || "Failed to create advertisement"
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error creating ad:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const updateFormData = (updates: Partial<FormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }))
  }

  const isStep1Valid = () => {
    return (
      formData.type &&
      formData.currency &&
      formData.amount &&
      formData.rate &&
      formData.minOrder &&
      formData.maxOrder &&
      Number.parseFloat(formData.amount) > 0 &&
      Number.parseFloat(formData.rate) > 0 &&
      Number.parseFloat(formData.minOrder) > 0 &&
      Number.parseFloat(formData.maxOrder) >= Number.parseFloat(formData.minOrder)
    )
  }

  const isStep2Valid = () => {
    return formData.paymentMethods.length > 0
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-2xl font-bold">Create Advertisement</h1>
        <p className="text-muted-foreground">Set up your P2P trading advertisement</p>
      </div>

      <ProgressSteps currentStep={currentStep} />

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>{currentStep === 1 ? "Ad Details" : "Payment Methods"}</CardTitle>
        </CardHeader>
        <CardContent>
          {currentStep === 1 ? (
            <AdDetailsForm formData={formData} updateFormData={updateFormData} currencies={currencies} />
          ) : (
            <PaymentDetailsForm formData={formData} updateFormData={updateFormData} paymentMethods={paymentMethods} />
          )}

          <div className="flex justify-between mt-6">
            <Button variant="outline" onClick={handlePrevious} disabled={currentStep === 1}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>

            {currentStep === 1 ? (
              <Button onClick={handleNext} disabled={!isStep1Valid()}>
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
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
