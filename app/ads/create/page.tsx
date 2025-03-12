"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import ProgressSteps from "../components/progress-steps"
import AdDetailsForm from "../components/ad-details-form"
import PaymentDetailsForm from "../components/payment-details-form"
import StatusModal from "@/components/ui/status-modal"
import type { AdFormData, StatusModalState } from "../types"
import { createAd, updateAd } from "../api/api-ads"

export default function CreateAdPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isEditMode = searchParams.get("mode") === "edit"
  const adId = searchParams.get("id")

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
  const [isLoading, setIsLoading] = useState(true)

  // Use a ref to store the current form data for the button click handler
  const formDataRef = useRef<Partial<AdFormData>>({})

  const steps = [
    { title: "Ad details", completed: currentStep > 0 },
    { title: "Payment details", completed: currentStep > 1 },
    { title: "Ad conditions", completed: false },
  ]

  // Load edit data if in edit mode
  useEffect(() => {
    const loadEditData = async () => {
      if (isEditMode) {
        try {
          setIsLoading(true)
          const editData = localStorage.getItem("editAdData")
          if (editData) {
            const parsedData = JSON.parse(editData)
            console.log("Loaded edit data:", parsedData)

            // Parse rate value to extract the number
            let rateValue = 0
            if (parsedData.rate && parsedData.rate.value) {
              const rateMatch = parsedData.rate.value.match(/([A-Z]+)\s+(\d+(?:\.\d+)?)/)
              if (rateMatch && rateMatch[2]) {
                rateValue = Number.parseFloat(rateMatch[2])
              }
            }

            // Parse limits if it's a string
            let minAmount = 0
            let maxAmount = 0

            if (typeof parsedData.limits === "string") {
              const limitsMatch = parsedData.limits.match(/([A-Z]+)\s+(\d+(?:\.\d+)?)\s+-\s+(\d+(?:\.\d+)?)/)
              if (limitsMatch) {
                minAmount = Number.parseFloat(limitsMatch[2])
                maxAmount = Number.parseFloat(limitsMatch[3])
              }
            } else if (parsedData.limits && typeof parsedData.limits === "object") {
              minAmount = parsedData.limits.min || 0
              maxAmount = parsedData.limits.max || 0
            }

            // Transform API data to form data format
            const formattedData: Partial<AdFormData> = {
              type: parsedData.type?.toLowerCase() === "sell" ? "sell" : "buy",
              totalAmount: parsedData.available?.current || 0,
              fixedRate: rateValue,
              minAmount: minAmount,
              maxAmount: maxAmount,
              paymentMethods: parsedData.paymentMethods || [],
              instructions: parsedData.description || "",
            }

            console.log("Formatted form data:", formattedData)
            setFormData(formattedData)
            formDataRef.current = formattedData
          }
        } catch (error) {
          console.error("Error loading edit data:", error)
        } finally {
          setIsLoading(false)
        }
      } else {
        setIsLoading(false)
      }
    }

    loadEditData()
  }, [isEditMode])

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
      console.group("📝 Final Form Data")
      console.log("Final Form Data:", finalData)
      console.log("Is Edit Mode:", isEditMode)
      console.log("Ad ID:", adId)
      console.groupEnd()

      if (isEditMode && adId) {
        // Update existing ad
        const payload = {
          is_active: true,
          minimum_order_amount: finalData.minAmount || 0,
          maximum_order_amount: finalData.maxAmount || 0,
          available_amount: finalData.totalAmount || 0,
          exchange_rate: finalData.fixedRate || 0,
          exchange_rate_type: "fixed",
          order_expiry_period: 15,
          description: finalData.instructions || "",
          payment_method_names: finalData.paymentMethods || [],
        }

        console.log("Update payload:", payload)
        await updateAd(adId, payload)

        // Clear edit data
        localStorage.removeItem("editAdData")

        // Store success data for banner display
        localStorage.setItem("adUpdateSuccess", JSON.stringify({ success: true }))

        // Navigate back to ads list
        router.push("/ads/my-ads")
      } else {
        // Create new ad
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
        router.push("/ads/my-ads")
      }
    } catch (error) {
      let errorMessage = isEditMode
        ? "Failed to update ad. Please try again."
        : "Failed to create ad. Please try again."
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
    router.push("/ads/my-ads")
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-red-500 border-r-transparent"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen pt-16">
      <div className="w-[240px] bg-gray-50 h-full p-6">
        <h1 className="text-xl font-semibold mb-6">{isEditMode ? "Edit Ad" : "Create Ad"}</h1>
        <ProgressSteps currentStep={currentStep} steps={steps} />
      </div>

      <div className="flex-1 relative">
        <div className="max-w-[800px] mx-auto">
          {currentStep === 0 ? (
            <AdDetailsForm
              onNext={handleAdDetailsNext}
              onClose={handleClose}
              initialData={formData}
              isEditMode={isEditMode}
            />
          ) : (
            <PaymentDetailsForm
              onBack={() => setCurrentStep(0)}
              onSubmit={handlePaymentDetailsSubmit}
              onClose={handleClose}
              initialData={formData}
              isSubmitting={isSubmitting}
              isEditMode={isEditMode}
            />
          )}
        </div>

        {/* Fixed positioned button at bottom right */}
        <div className="fixed bottom-6 right-6">
          <button
            onClick={handleButtonClick}
            disabled={isSubmitting}
            className={`px-8 py-2.5 rounded-full text-sm font-medium
              ${currentStep === 0
                ? "bg-gray-100 text-gray-900 hover:bg-gray-200"
                : isSubmitting
                  ? "bg-red-400 text-white cursor-not-allowed"
                  : "bg-red-500 text-white hover:bg-red-600"
              }`}
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <span>{isEditMode ? "Saving..." : "Creating..."}</span>
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            ) : currentStep === 0 ? (
              "Next"
            ) : isEditMode ? (
              "Save Changes"
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

