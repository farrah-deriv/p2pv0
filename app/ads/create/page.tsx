"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import ProgressSteps from "../components/progress-steps"
import TradeTypeSelector from "../components/ui/trade-type-selector"
import AdDetailsForm from "../components/ad-details-form"
import AdPaymentMethods from "../components/ad-payment-methods"
import { createAd } from "../api/api-ads"
import { getUserPaymentMethods } from "@/app/profile/api/api-payment-methods"

interface FormData {
  type?: "Buy" | "Sell"
  buyCurrency?: string
  sellCurrency?: string
  totalAmount?: number
  fixedRate?: number
  minAmount?: number
  maxAmount?: number
  instructions?: string
  paymentMethods?: string[]
}

const getStepTitle = (step: number, isEditMode: boolean) => {
  const titles = [
    `${isEditMode ? "Edit" : "Create"} Ad - Type`,
    `${isEditMode ? "Edit" : "Create"} Ad - Details`,
    `${isEditMode ? "Edit" : "Create"} Ad - Payment Methods`,
  ]
  return titles[step - 1] || "Create Ad"
}

const getStepDescription = (step: number, isEditMode: boolean) => {
  const descriptions = [
    `Choose whether you want to ${isEditMode ? "change the" : "create a"} buy or sell ad`,
    `${isEditMode ? "Update" : "Enter"} the details for your ad`,
    `${isEditMode ? "Update" : "Select"} payment methods for your ad`,
  ]
  return descriptions[step - 1] || ""
}

export default function CreateAdPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<FormData>({})
  const [isLoading, setIsLoading] = useState(false)
  const [isEditMode] = useState(false)
  const [userPaymentMethods, setUserPaymentMethods] = useState<any[]>([])

  useEffect(() => {
    const loadUserPaymentMethods = async () => {
      try {
        const methods = await getUserPaymentMethods()
        setUserPaymentMethods(methods)
      } catch (error) {
        toast.error("Failed to load payment methods")
      }
    }
    loadUserPaymentMethods()
  }, [])

  useEffect(() => {
    const checkForSuccessData = () => {
      try {
        const successData = localStorage.getItem("adCreationSuccess")
        if (successData) {
          const { adId, type } = JSON.parse(successData)
          localStorage.removeItem("adCreationSuccess")

          toast.success(`${type} ad created successfully!`, {
            description: `Ad ID: ${adId}`,
            duration: 5000,
          })

          setTimeout(() => {
            router.push("/ads/my-ads")
          }, 2000)
        }
      } catch (error) {
        console.log(error)
      }
    }

    checkForSuccessData()
  }, [router])

  const handleStepComplete = (stepData: any) => {
    setFormData((prev) => ({ ...prev, ...stepData }))

    if (currentStep < 3) {
      setCurrentStep(currentStep + 1)
    } else {
      handleSubmit({ ...formData, ...stepData })
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async (finalData: FormData) => {
    setIsLoading(true)

    try {
      const payload = {
        type: finalData.type?.toLowerCase() || "buy",
        amount: finalData.totalAmount || 0,
        exchange_rate: finalData.fixedRate || 0,
        minimum_order_amount: finalData.minAmount || 0,
        maximum_order_amount: finalData.maxAmount || 0,
        description: finalData.instructions || "",
        payment_method_names: finalData.paymentMethods || [],
        currency: finalData.buyCurrency || "USD",
        payment_currency: finalData.sellCurrency || "USD",
      }

      const result = await createAd(payload)

      if (result.success) {
        localStorage.setItem(
          "adCreationSuccess",
          JSON.stringify({
            adId: result.data.id,
            type: finalData.type,
          }),
        )

        window.location.reload()
      } else {
        const errorMessage = result.errors?.[0]?.message || "Failed to create ad"

        if (errorMessage === "ad_limit_reached") {
          toast.error("Ad Limit Reached", {
            description:
              "You've reached the maximum number of ads allowed. Please delete some existing ads to create new ones.",
            duration: 8000,
          })
        } else {
          toast.error("Failed to create ad", {
            description: errorMessage,
            duration: 5000,
          })
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred"

      if (errorMessage === "ad_limit_reached") {
        toast.error("Ad Limit Reached", {
          description:
            "You've reached the maximum number of ads allowed. Please delete some existing ads to create new ones.",
          duration: 8000,
        })
      } else {
        toast.error("Failed to create ad", {
          description: errorMessage,
          duration: 5000,
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return <TradeTypeSelector onNext={handleStepComplete} initialData={formData} isEditMode={isEditMode} />
      case 2:
        return (
          <AdDetailsForm
            type={formData.type || "Buy"}
            onNext={handleStepComplete}
            onBack={handleBack}
            initialData={formData}
            isEditMode={isEditMode}
          />
        )
      case 3:
        return (
          <AdPaymentMethods
            onNext={handleStepComplete}
            onBack={handleBack}
            initialData={formData}
            isEditMode={isEditMode}
            userPaymentMethods={userPaymentMethods}
            isLoading={isLoading}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{getStepTitle(currentStep, isEditMode)}</h1>
        <p className="text-muted-foreground">{getStepDescription(currentStep, isEditMode)}</p>
      </div>

      <ProgressSteps currentStep={currentStep} totalSteps={3} />

      <div className="mt-8">{renderCurrentStep()}</div>
    </div>
  )
}
