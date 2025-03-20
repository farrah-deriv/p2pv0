"use client"

import type React from "react"

import { useState } from "react"
import { X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"

interface AddPaymentMethodModalProps {
  onClose: () => void
  onAdd: (name: string, instructions: string) => void
  isLoading: boolean
}

export default function AddPaymentMethodModal({ onClose, onAdd, isLoading }: AddPaymentMethodModalProps) {
  const [name, setName] = useState("")
  const [instructions, setInstructions] = useState("")
  const [errors, setErrors] = useState({
    name: "",
    instructions: "",
  })

  const validateForm = () => {
    const newErrors = {
      name: "",
      instructions: "",
    }

    if (!name.trim()) {
      newErrors.name = "Payment method name is required"
    }

    if (!instructions.trim()) {
      newErrors.instructions = "Instructions are required"
    }

    setErrors(newErrors)
    return !newErrors.name && !newErrors.instructions
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (validateForm()) {
      onAdd(name, instructions)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md">
        <div className="p-6 border-b relative">
          <h2 className="text-xl font-semibold text-center">Add payment method</h2>
          <button
            onClick={onClose}
            className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label htmlFor="payment-method" className="block text-sm font-medium text-gray-700 mb-1">
              Payment method
            </label>
            <Input
              id="payment-method"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Bank Transfer, PayPal"
            />
            {errors.name && <p className="mt-1 text-xs">{errors.name}</p>}
          </div>

          <div>
            <label htmlFor="instructions" className="block text-sm font-medium text-gray-700 mb-1">
              Instructions
            </label>
            <Textarea
              id="instructions"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Provide details about your payment method"
              className="min-h-[120px]"
            />
            {errors.instructions && <p className="mt-1 text-xs">{errors.instructions}</p>}
            <p className="mt-2 text-xs text-gray-500">
              These instructions will be shown to the counterparty during the order process.
            </p>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" onClick={onClose} variant="outline" size="sm">
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} size="sm">
              {isLoading ? "Adding..." : "Add"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

