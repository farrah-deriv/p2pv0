export interface AdFormData {
  // Step 1: Ad Details
  type: "buy" | "sell"
  totalAmount: number
  fixedRate: number
  minAmount: number
  maxAmount: number

  // Step 2: Payment Details
  paymentMethods: string[]
  instructions: string
}
