export interface Ad {
  id: string
  type: "Buy" | "Sell"
  rate: {
    value: string
    percentage: string
    currency: string
  }
  limits:
    | string
    | {
        min: number
        max: number
        currency: string
      }
  available: {
    current: number
    total: number
    currency: string
  }
  paymentMethods: string[]
  status: "Active" | "Inactive"
  description: string
}
