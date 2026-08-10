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
  account_currency?: string
  payment_currency?: string
  available_amount?: number
  open_order_amount?: number
  completed_order_amount?: number
  minimum_order_amount?: number
  actual_maximum_order_amount?: number
  exchange_rate?: number
  exchange_rate_type?: string
  payment_methods?: string[]
  is_active?: boolean
  is_orderable?: boolean
  user?: {
    id: string
    name?: string
  }
  advertiser_id?: string
  visibility_status?: string[]
}
