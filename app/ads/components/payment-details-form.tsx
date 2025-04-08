"use client"

import type React from "react"
import { useState, useEffect } from "react"
import type { AdFormData } from "../types"
import { useIsMobile } from "@/hooks/use-mobile"
import { Check, ChevronDown, ChevronUp } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea" // Import the core Textarea component
import PaymentMethodBottomSheet from "./payment-method-bottom-sheet"

interface PaymentDetailsFormProps {
  onBack: () => void
  onSubmit: (data: Partial<AdFormData>, errors?: Record<string, string>) => void
  onClose: () => void
  initialData: Partial<AdFormData>
  isSubmitting?: boolean
  isEditMode?: boolean
  onBottomSheetOpenChange?: (isOpen: boolean) => void
}

export default function PaymentDetailsForm({
  onBack,
  onSubmit,
  onClose,
  initialData,
  isSubmitting = false,
  isEditMode = false,
  onBottomSheetOpenChange,
}: PaymentDetailsFormProps) {
  const isMobile = useIsMobile()
  const [paymentMethods, setPaymentMethods] = useState<string[]>(initialData.paymentMethods || [])
  const [instructions, setInstructions] = useState(() => {
    console.log("Initializing instructions with:", initialData.instructions)
    return initialData.instructions || ""
  })
  const [touched, setTouched] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [bottomSheetOpen, setBottomSheetOpen] = useState(false)

  // Available payment methods
  const availablePaymentMethods = ["Bank Transfer", "PayPal", "Wise", "Neteller", "Skrill", "Alipay", "WeChat Pay"]

  // Maximum number of payment methods allowed
  const MAX_PAYMENT_METHODS = 3

  // Notify parent component when bottom sheet state changes
  useEffect(() => {
    if (onBottomSheetOpenChange) {
      onBottomSheetOpenChange(bottomSheetOpen)
    }
  }, [bottomSheetOpen, onBottomSheetOpenChange])

  // Add logging to debug instructions initialization
  console.log("PaymentDetailsForm initialData:", initialData)
  console.log("Initial instructions value:", initialData.instructions)

  // Update state when initialData changes (important for edit mode)
  useEffect(() => {
    if (initialData) {
      console.log("initialData changed in PaymentDetailsForm:", initialData)

      if (initialData.paymentMethods) {
        console.log("Setting payment methods:", initialData.paymentMethods)
        setPaymentMethods(initialData.paymentMethods)
      }

      if (initialData.instructions !== undefined) {
        console.log("Updating instructions to:", initialData.instructions)
        setInstructions(initialData.instructions)
      } else {
        console.log("initialData.instructions is undefined")
      }
    }
  }, [initialData])

  // First, modify the isFormValid function to not require payment methods for "sell" ads
  const isFormValid = () => {
    // If it's a sell ad, we don't need payment methods
    if (initialData.type === "sell") {
      return true
    }
    // For buy ads, we still require at least one payment method
    return paymentMethods.length > 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setTouched(true)

    // Check if form is valid
    const formValid = isFormValid()
    const errors = !formValid ? { paymentMethods: "At least one payment method is required" } : undefined

    const formData = {
      paymentMethods,
      instructions,
    }

    console.log("Submitting form data:", formData)

    // If form is valid, submit; otherwise, pass errors
    if (formValid) {
      onSubmit(formData)
    } else {
      onSubmit(formData, errors)
    }
  }

  const togglePaymentMethod = (method: string) => {
    setTouched(true)

    if (paymentMethods.includes(method)) {
      // Remove the method if it's already selected
      setPaymentMethods(paymentMethods.filter((m) => m !== method))
    } else if (paymentMethods.length < MAX_PAYMENT_METHODS) {
      // Add the method if we haven't reached the maximum
      setPaymentMethods([...paymentMethods, method])
    }
  }

  // Handle payment methods selection from bottom sheet
  const handleSelectPaymentMethods = (methods: string[]) => {
    setTouched(true)
    setPaymentMethods(methods)
  }

  // Handle bottom sheet open/close
  const handleOpenBottomSheet = () => {
    setBottomSheetOpen(true)
    // Notify parent component about the state change
    if (onBottomSheetOpenChange) {
      onBottomSheetOpenChange(true)
    }
  }

  const handleCloseBottomSheet = () => {
    setBottomSheetOpen(false)
    // Notify parent component about the state change
    if (onBottomSheetOpenChange) {
      onBottomSheetOpenChange(false)
    }
  }

  // Check if a method is selected
  const isMethodSelected = (method: string) => paymentMethods.includes(method)

  // Check if we've reached the maximum number of selections
  const isMaxReached = paymentMethods.length >= MAX_PAYMENT_METHODS

  // Update the useEffect for validation to account for the ad type
  useEffect(() => {
    const isValid = initialData.type === "sell" ? true : paymentMethods.length > 0
    // Use a custom event to communicate the form state to the parent
    const event = new CustomEvent("paymentFormValidationChange", {
      bubbles: true,
      detail: {
        isValid,
        formData: {
          paymentMethods: initialData.type === "sell" ? [] : paymentMethods,
          instructions,
        },
      },
    })
    document.dispatchEvent(event)
  }, [paymentMethods, instructions, initialData.type])

  return (
    <div className="h-full flex flex-col">
      <form id="payment-details-form" onSubmit={handleSubmit} className="flex-1 py-6">
        <div className="max-w-[800px] mx-auto h-full flex flex-col">
          <div className="space-y-8">
            {initialData.type === "buy" && (
              <div>
                <h3 className="text-base font-bold leading-6 tracking-normal mb-4">Select payment method</h3>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Payment methods</label>

                  {isMobile ? (
                    <>
                      <Button
                        variant="outline"
                        className="w-full h-[48px] rounded-[4px] border border-gray-300 justify-between text-left"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          handleOpenBottomSheet()
                        }}
                      >
                        {paymentMethods.length > 0 ? `Selected (${paymentMethods.length})` : "Select"}
                        <ChevronDown className="h-4 w-4 opacity-70" />
                      </Button>

                      <PaymentMethodBottomSheet
                        isOpen={bottomSheetOpen}
                        onClose={() => {
                          // Just close the bottom sheet without triggering any other actions
                          handleCloseBottomSheet()
                        }}
                        onSelect={(methods) => {
                          // Update the selected methods and close the bottom sheet
                          handleSelectPaymentMethods(methods)
                          handleCloseBottomSheet()
                        }}
                        selectedMethods={paymentMethods}
                        availableMethods={availablePaymentMethods}
                        maxSelections={MAX_PAYMENT_METHODS}
                      />
                    </>
                  ) : (
                    <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full md:w-[360px] h-[48px] rounded-[4px] border border-gray-300 justify-between text-left"
                          onClick={(e) => {
                            e.preventDefault()
                            setDropdownOpen(!dropdownOpen)
                          }}
                        >
                          {paymentMethods.length > 0 ? `Selected (${paymentMethods.length})` : "Select"}
                          {dropdownOpen ? (
                            <ChevronUp className="h-4 w-4 opacity-70" />
                          ) : (
                            <ChevronDown className="h-4 w-4 opacity-70" />
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-[360px] min-w-[360px]">
                        {availablePaymentMethods.map((method) => (
                          <DropdownMenuItem
                            key={method}
                            onSelect={(e) => {
                              e.preventDefault()
                              togglePaymentMethod(method)
                            }}
                            disabled={!isMethodSelected(method) && isMaxReached}
                            className={`flex items-center gap-2 px-3 py-2 cursor-pointer ${
                              !isMethodSelected(method) && isMaxReached ? "opacity-50" : ""
                            }`}
                          >
                            <div
                              className={`w-5 h-5 flex items-center justify-center rounded border ${
                                isMethodSelected(method) ? "bg-[#00D2FF] border-[#00D2FF]" : "border-gray-300"
                              }`}
                            >
                              {isMethodSelected(method) && <Check className="h-3 w-3 text-white" />}
                            </div>
                            <span>{method}</span>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}

                  {touched && paymentMethods.length === 0 && initialData.type === "buy" && (
                    <p className="text-destructive text-xs mt-1">Payment method is required</p>
                  )}

                  {isMaxReached && (
                    <p className="text-amber-600 text-xs mt-1">
                      Maximum of {MAX_PAYMENT_METHODS} payment methods reached
                    </p>
                  )}
                </div>
              </div>
            )}

            <div>
              <h3 className="text-base font-bold leading-6 tracking-normal mb-4">Instructions (Optional)</h3>
              <Textarea
                value={instructions}
                onChange={(e) => {
                  console.log("Textarea onChange, new value:", e.target.value)
                  setInstructions(e.target.value)
                }}
                placeholder="Enter your trade instructions"
                className="min-h-[120px] resize-none"
                maxLength={300}
              />
              <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                <span>
                  This information will be visible to everyone. Don't share your phone number or personal details.
                </span>
                <span>{instructions.length}/300</span>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
