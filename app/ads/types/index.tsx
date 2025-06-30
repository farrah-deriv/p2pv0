// API Response Types
export interface APIAdvert {
  id: number
  type: string
  account_currency: string
  payment_currency: string
  minimum_order_amount: number
  maximum_order_amount: number
  actual_maximum_order_amount: number
  available_amount: number
  exchange_rate: number
  exchange_rate_type: string
  is_active: boolean
  order_expiry_period: number
  description: string
  payment_methods: string[] // Updated from payment_method_names
  created_at: number
  updated_at?: number
}

// UI Types
export interface MyAd {
  id: string
  type: "Buy" | "Sell"
  rate: {
    value: string
    percentage: string
    currency: string
  }
  limits: {
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
  createdAt: string
  updatedAt: string
}

export interface AdFilters {
  type?: "Buy" | "Sell"
  status?: "Active" | "Inactive"
  adId?: string
}

export interface CreateAdPayload {
  type: string
  account_currency: string
  payment_currency: string
  minimum_order_amount: number
  maximum_order_amount: number
  available_amount: number
  exchange_rate: number
  exchange_rate_type: string
  order_expiry_period: number
  description: string
  payment_methods: string[] // Updated from payment_method_names
}

export interface CreateAdResponse {
  id: string
  type: string
  status: string
  created_at: string
}
