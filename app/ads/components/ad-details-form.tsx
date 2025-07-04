"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getCurrencies } from "../api/api-ads"

interface AdDetailsFormProps {
  type: "Buy" | "Sell"
  onNext: (data: any) => void
  onBack: () => void
  initialData?: any
  isEditMode?: boolean
}

export default function AdDetailsForm({ type, onNext, onBack, initialData, isEditMode = false }: AdDetailsFormProps) {
  const [currencies, setCurrencies] = useState<string[]>([])
  const [buyCurrency, setBuyCurrency] = useState(initialData?.buyCurrency || "USD")
  const [sellCurrency, setSellCurrency] = useState(initialData?.sellCurrency || "USD")
  const [totalAmount, setTotalAmount] = useState(initialData?.totalAmount || "")
  const [fixedRate, setFixedRate] = useState(initialData?.fixedRate || "")
  const [minAmount, setMinAmount] = useState(initialData?.minAmount || "")
  const [maxAmount, setMaxAmount] = useState(initialData?.maxAmount || "")
  const [instructions, setInstructions] = useState(initialData?.instructions || "")
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({})

  useEffect(() => {
    const loadCurrencies = async () => {
      const currencyList = await getCurrencies()
      setCurrencies(currencyList)
    }
    loadCurrencies()
  }, [])

  const validateForm = () => {
    const errors: { [key: string]: string } = {}

    if (!totalAmount || Number.parseFloat(totalAmount) <= 0) {
      errors.totalAmount = "Total amount must be greater than 0"
    }

    if (!fixedRate || Number.parseFloat(fixedRate) <= 0) {
      errors.fixedRate = "Fixed rate must be greater than 0"
    }

    if (!minAmount || Number.parseFloat(minAmount) <= 0) {
      errors.minAmount = "Minimum amount must be greater than 0"
    }

    if (!maxAmount || Number.parseFloat(maxAmount) <= 0) {
      errors.maxAmount = "Maximum amount must be greater than 0"
    }

    if (Number.parseFloat(minAmount) >= Number.parseFloat(maxAmount)) {
      errors.maxAmount = "Maximum amount must be greater than minimum amount"
    }

    if (Number.parseFloat(maxAmount) > Number.parseFloat(totalAmount)) {
      errors.maxAmount = "Maximum amount cannot exceed total amount"
    }

    if (buyCurrency === sellCurrency) {
      errors.sellCurrency = "Buy and sell currencies must be different"
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleNext = () => {
    if (validateForm()) {
      const formData = {
        type,
        buyCurrency,
        sellCurrency,
        totalAmount: Number.parseFloat(totalAmount),
        fixedRate: Number.parseFloat(fixedRate),
        minAmount: Number.parseFloat(minAmount),
        maxAmount: Number.parseFloat(maxAmount),
        instructions,
      }
      onNext(formData)
    }
  }

  useEffect(() => {
    if (totalAmount && fixedRate && minAmount && maxAmount) {
      validateForm()
    }
  }, [type, totalAmount, fixedRate, minAmount, maxAmount, formErrors])

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>
          {isEditMode ? "Edit" : "Create"} {type} Ad - Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="buy-currency">I want to {type.toLowerCase()}</Label>
            <Select value={buyCurrency} onValueChange={setBuyCurrency}>
              <SelectTrigger>
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                {currencies.map((currency) => (
                  <SelectItem key={currency} value={currency}>
                    {currency}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sell-currency">For</Label>
            <Select value={sellCurrency} onValueChange={setSellCurrency}>
              <SelectTrigger>
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                {currencies.map((currency) => (
                  <SelectItem key={currency} value={currency}>
                    {currency}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {formErrors.sellCurrency && <p className="text-sm text-red-500">{formErrors.sellCurrency}</p>}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="total-amount">Total Amount ({buyCurrency})</Label>
          <Input
            id="total-amount"
            type="number"
            placeholder="Enter total amount"
            value={totalAmount}
            onChange={(e) => setTotalAmount(e.target.value)}
            className={formErrors.totalAmount ? "border-red-500" : ""}
          />
          {formErrors.totalAmount && <p className="text-sm text-red-500">{formErrors.totalAmount}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="fixed-rate">
            Fixed Rate (1 {buyCurrency} = ? {sellCurrency})
          </Label>
          <Input
            id="fixed-rate"
            type="number"
            step="0.0001"
            placeholder="Enter fixed rate"
            value={fixedRate}
            onChange={(e) => setFixedRate(e.target.value)}
            className={formErrors.fixedRate ? "border-red-500" : ""}
          />
          {formErrors.fixedRate && <p className="text-sm text-red-500">{formErrors.fixedRate}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="min-amount">Minimum Order ({sellCurrency})</Label>
            <Input
              id="min-amount"
              type="number"
              placeholder="Enter minimum amount"
              value={minAmount}
              onChange={(e) => setMinAmount(e.target.value)}
              className={formErrors.minAmount ? "border-red-500" : ""}
            />
            {formErrors.minAmount && <p className="text-sm text-red-500">{formErrors.minAmount}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="max-amount">Maximum Order ({sellCurrency})</Label>
            <Input
              id="max-amount"
              type="number"
              placeholder="Enter maximum amount"
              value={maxAmount}
              onChange={(e) => setMaxAmount(e.target.value)}
              className={formErrors.maxAmount ? "border-red-500" : ""}
            />
            {formErrors.maxAmount && <p className="text-sm text-red-500">{formErrors.maxAmount}</p>}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="instructions">Instructions (Optional)</Label>
          <Textarea
            id="instructions"
            placeholder="Enter any special instructions for buyers/sellers..."
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            rows={4}
          />
        </div>

        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={onBack}>
            Back
          </Button>
          <Button onClick={handleNext}>Next</Button>
        </div>
      </CardContent>
    </Card>
  )
}
