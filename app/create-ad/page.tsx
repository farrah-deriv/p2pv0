"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import ProgressSteps from "@/components/create-ad/progress-steps"
import AdDetailsForm from "@/components/create-ad/ad-details-form"
import PaymentDetailsForm from "@/components/create-ad/payment-details-form"
import StatusModal from "@/components/ui/status-modal"
import type { AdFormData } from "@/lib/types/ad"
import { createAd } from "@/services/api/api-my-ads"

interface StatusModalState {
  show: boolean
  type: "success" | "error"
  title: string
  message: string
  subMessage?: string
}

export default function CreateAdPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState<Partial<AdFormData>>({})
  const [statusModal, setStatusModal] = useState<StatusModalState>({
    show: false,
    type: "success",
    title: "",
    message: "",
    subMessage: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Use a ref to store the current form data for the button click handler
  const formDataRef = useRef<Partial<AdFormData>>({})

  const steps = [
    { title: "Ad details", completed: currentStep > 0 },
    { title: "Payment details", completed: currentStep > 1 },
    { title: "Ad conditions", completed: false },
  ]

  const handleAdDetailsNext = (data: Partial<AdFormData>) => {
    const updatedData = { ...formData, ...data }
    setFormData(updatedData)
    formDataRef.current = updatedData
    setCurrentStep(1)

    // Log the updated form data
    console.group("📝 Updated Form Data (Ad Details)")
    console.log("Form Data:", updatedData)
    console.groupEnd()
  }

  const handlePaymentDetailsSubmit = async (data: Partial<AdFormData>) => {
    const finalData = { ...formData, ...data }
    formDataRef.current = finalData
    setIsSubmitting(true)

    try {
      // Log the form data for debugging
      console.group("📝 Final Form Data for Create Ad")
      console.log("Final Form Data:", finalData)
      console.groupEnd()

      // Ensure all required fields have valid values
      const payload = {
        type: finalData.type || "buy",
        account_currency: "USD",
        payment_currency: "IDR",
        minimum_order_amount: finalData.minAmount || 0,
        maximum_order_amount: finalData.maxAmount || 0,
        available_amount: finalData.totalAmount || 0,
        exchange_rate: finalData.fixedRate || 0,
        exchange_rate_type: "fixed" as const,
        description: finalData.instructions || "",
        is_active: 1,
        order_expiry_period: 15,
        payment_method_names: finalData.paymentMethods || [],
      }

      // Log the API payload for debugging
      console.group("📤 API Payload for Create Ad")
      console.log("Payload:", payload)
      console.groupEnd()

      const result = await createAd(payload)

      // Store success data in localStorage before navigation
      localStorage.setItem(
        "adCreationSuccess",
        JSON.stringify({
          type: result.data.type,
          id: result.data.id,
        }),
      )

      // Navigate to the ads screen
      router.push("/my-ads")
    } catch (error) {
      let errorMessage = "Failed to create ad. Please try again."
      let errorTitle = "Error"

      if (error instanceof Error) {
        if (error.message === "ad_limit_reached" || error.name === "AdvertLimitReached") {
          errorTitle = "Ad limit reached"
          errorMessage =
            "You can have only 3 active ads for this currency pair and order type. Delete one to create a new ad."
        } else if (error.name === "AdvertExchangeRateDuplicate") {
          errorTitle = "Duplicate exchange rate"
          errorMessage = "You already have an ad with this exchange rate. Please use a different rate."
        } else if (error.name === "InsufficientBalance") {
          errorTitle = "Insufficient balance"
          errorMessage = "You don't have enough balance to create this ad."
        } else if (error.name === "InvalidExchangeRate" || error.name === "InvalidOrderAmount") {
          errorTitle = "Invalid values"
          errorMessage = error.message
        } else {
          errorMessage = error.message || errorMessage
        }
      }

      setStatusModal({
        show: true,
        type: "error",
        title: errorTitle,
        message: errorMessage,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleButtonClick = () => {
    if (currentStep === 0) {
      // Get the current form data from the ref
      const adDetailsFormData = document.getElementById("ad-details-form") as HTMLFormElement
      if (adDetailsFormData) {
        adDetailsFormData.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }))
      }
    } else {
      // Get the current form data from the ref
      const paymentDetailsFormData = document.getElementById("payment-details-form") as HTMLFormElement
      if (paymentDetailsFormData) {
        paymentDetailsFormData.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }))
      }
    }
  }

  const handleModalClose = () => {
    setStatusModal((prev) => ({ ...prev, show: false }))
  }

  const handleClose = () => {
    router.push("/my-ads")
  }

  return (
    <div className="flex h-screen">
      <div className="w-[240px] bg-gray-50 h-full p-6">
        <h1 className="text-xl font-semibold mb-6">Create Ad</h1>
        <ProgressSteps currentStep={currentStep} steps={steps} />
      </div>

      <div className="flex-1 relative">
        <div className="max-w-[800px] mx-auto">
          {currentStep === 0 ? (
            <AdDetailsForm onNext={handleAdDetailsNext} onClose={handleClose} initialData={formData} />
          ) : (
            <PaymentDetailsForm
              onBack={() => setCurrentStep(0)}
              onSubmit={handlePaymentDetailsSubmit}
              onClose={handleClose}
              initialData={formData}
              isSubmitting={isSubmitting}
            />
          )}
        </div>

        {/* Fixed positioned button at bottom right */}
        <div className="fixed bottom-6 right-6">
          <button
            onClick={handleButtonClick}
            disabled={isSubmitting}
            className={`px-8 py-2.5 rounded-full text-sm font-medium
              ${
                currentStep === 0
                  ? "bg-gray-100 text-gray-900 hover:bg-gray-200"
                  : isSubmitting
                    ? "bg-red-400 text-white cursor-not-allowed"
                    : "bg-red-500 text-white hover:bg-red-600"
              }`}
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <span>Creating...</span>
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            ) : currentStep === 0 ? (
              "Next"
            ) : (
              "Create Ad"
            )}
          </button>
        </div>
      </div>

      {statusModal.show && (
        <StatusModal
          type={statusModal.type}
          title={statusModal.title}
          message={statusModal.message}
          subMessage={statusModal.subMessage}
          onClose={handleModalClose}
        />
      )}
    </div>
  )
}

