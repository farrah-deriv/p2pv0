"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"

interface BankTransferEditPanelProps {
  onClose: () => void
  onSave: (id: string, fields: Record<string, string>) => void
  isLoading: boolean
  paymentMethod: {
    id: string
    name: string
    type: string
    details: Record<string, any>
    instructions?: string
  }
}

export default function BankTransferEditPanel({
  onClose,
  onSave,
  isLoading,
  paymentMethod,
}: BankTransferEditPanelProps) {
  const [account, setAccount] = useState("")
  const [bankName, setBankName] = useState("")
  const [bankCode, setBankCode] = useState("")
  const [branch, setBranch] = useState("")
  const [instructions, setInstructions] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [charCount, setCharCount] = useState(0)

  // Extract values from the nested structure
  useEffect(() => {
    if (paymentMethod && paymentMethod.details) {
      console.log("Bank Transfer Edit - Payment Method:", paymentMethod)

      // Extract account
      if (paymentMethod.details.account) {
        const accountField = paymentMethod.details.account
        if (typeof accountField === "object") {
          if (accountField.value && typeof accountField.value === "object" && "value" in accountField.value) {
            setAccount(accountField.value.value || "")
          } else if ("value" in accountField) {
            setAccount(accountField.value || "")
          }
        } else {
          setAccount(accountField || "")
        }
      }

      // Extract bank name
      if (paymentMethod.details.bank_name) {
        const bankNameField = paymentMethod.details.bank_name
        if (typeof bankNameField === "object") {
          if (bankNameField.value && typeof bankNameField.value === "object" && "value" in bankNameField.value) {
            setBankName(bankNameField.value.value || "")
          } else if ("value" in bankNameField) {
            setBankName(bankNameField.value || "")
          }
        } else {
          setBankName(bankNameField || "")
        }
      }

      // Extract bank code
      if (paymentMethod.details.bank_code) {
        const bankCodeField = paymentMethod.details.bank_code
        if (typeof bankCodeField === "object") {
          if (bankCodeField.value && typeof bankCodeField.value === "object" && "value" in bankCodeField.value) {
            setBankCode(bankCodeField.value.value || "")
          } else if ("value" in bankCodeField) {
            setBankCode(bankCodeField.value || "")
          }
        } else {
          setBankCode(bankCodeField || "")
        }
      }

      // Extract branch
      if (paymentMethod.details.branch) {
        const branchField = paymentMethod.details.branch
        if (typeof branchField === "object") {
          if (branchField.value && typeof branchField.value === "object" && "value" in branchField.value) {
            setBranch(branchField.value.value || "")
          } else if ("value" in branchField) {
            setBranch(branchField.value || "")
          }
        } else {
          setBranch(branchField || "")
        }
      }

      // Extract instructions
      let instructionsValue = ""
      if (paymentMethod.details.instructions) {
        const instructionsField = paymentMethod.details.instructions
        if (typeof instructionsField === "object") {
          if (
            instructionsField.value &&
            typeof instructionsField.value === "object" &&
            "value" in instructionsField.value
          ) {
            instructionsValue = instructionsField.value.value || ""
          } else if ("value" in instructionsField) {
            instructionsValue = instructionsField.value || ""
          }
        } else {
          instructionsValue = instructionsField || ""
        }
      } else if (paymentMethod.instructions) {
        instructionsValue = typeof paymentMethod.instructions === "string" ? paymentMethod.instructions : ""
      }

      setInstructions(instructionsValue)

      // Reset errors and touched state
      setErrors({})
      setTouched({})
    }
  }, [paymentMethod])

  // Update character count for instructions
  useEffect(() => {
    setCharCount(instructions.length)
  }, [instructions])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!account.trim()) {
      newErrors.account = "Account number is required"
    }

    if (!bankName.trim()) {
      newErrors.bank_name = "Bank name is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (name: string, value: string, setter: React.Dispatch<React.SetStateAction<string>>) => {
    setter(value)
    setTouched((prev) => ({ ...prev, [name]: true }))

    // Clear error when user types
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Mark required fields as touched
    setTouched({
      account: true,
      bank_name: true,
      ...touched,
    })

    if (validateForm()) {
      // Create a fields object with all the form field values
      const fieldValues = {
        method_type: "bank_transfer",
        account,
        bank_name: bankName,
        bank_code: bankCode,
        branch,
      }

      // Add instructions if present
      if (instructions.trim()) {
        fieldValues.instructions = instructions.trim()
      }

      console.log("Submitting bank transfer field values:", fieldValues)

      // Pass the payment method ID and field values to the parent component
      onSave(paymentMethod.id, fieldValues)
    }
  }

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-xl flex flex-col">
      <div className="p-6 border-b relative">
        <h2 className="text-xl font-semibold">Edit bank transfer</h2>
        <button
          onClick={onClose}
          className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6">
          <div className="text-lg font-medium">Bank Transfer</div>

          <div className="space-y-4">
            <div>
              <label htmlFor="account" className="block text-sm font-medium text-gray-500 mb-2">
                Account Number
              </label>
              <Input
                id="account"
                type="text"
                value={account}
                onChange={(e) => handleInputChange("account", e.target.value, setAccount)}
                placeholder="Enter account number"
              />
              {touched.account && errors.account && <p className="mt-1 text-xs text-red-500">{errors.account}</p>}
            </div>

            <div>
              <label htmlFor="bank_name" className="block text-sm font-medium text-gray-500 mb-2">
                Bank Name
              </label>
              <Input
                id="bank_name"
                type="text"
                value={bankName}
                onChange={(e) => handleInputChange("bank_name", e.target.value, setBankName)}
                placeholder="Enter bank name"
              />
              {touched.bank_name && errors.bank_name && <p className="mt-1 text-xs text-red-500">{errors.bank_name}</p>}
            </div>

            <div>
              <label htmlFor="bank_code" className="block text-sm font-medium text-gray-500 mb-2">
                SWIFT or IFSC code
              </label>
              <Input
                id="bank_code"
                type="text"
                value={bankCode}
                onChange={(e) => handleInputChange("bank_code", e.target.value, setBankCode)}
                placeholder="Enter SWIFT or IFSC code"
              />
            </div>

            <div>
              <label htmlFor="branch" className="block text-sm font-medium text-gray-500 mb-2">
                Branch
              </label>
              <Input
                id="branch"
                type="text"
                value={branch}
                onChange={(e) => handleInputChange("branch", e.target.value, setBranch)}
                placeholder="Enter branch name"
              />
            </div>
          </div>

          <div>
            <label htmlFor="instructions" className="block text-sm font-medium text-gray-500 mb-2">
              Instructions
            </label>
            <Textarea
              id="instructions"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Enter your instructions"
              className="min-h-[120px] resize-none"
              maxLength={300}
            />
            <div className="flex justify-end mt-1 text-xs text-gray-500">{charCount}/300</div>
          </div>
        </div>
      </form>

      <div className="p-6 border-t">
        <Button type="button" onClick={handleSubmit} disabled={isLoading} size="sm" className="w-full">
          {isLoading ? "Saving..." : "Save details"}
        </Button>
      </div>
    </div>
  )
}

