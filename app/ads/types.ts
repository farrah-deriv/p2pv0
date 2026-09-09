export interface AdFormData {
  id?: string
  type?: "buy" | "sell"
  priceType?: "fixed" | "float"
  totalAmount?: number
  fixedRate?: number | string
  floatingRate?: number | string
  minAmount?: number
  maxAmount?: number
  paymentMethods?: string[]
  payment_method_ids?: number[]
  instructions?: string
  forCurrency?: string
  buyCurrency?: string
  order_expiry_period?: number
  available_countries?: string[]
  minimum_join_days?: number | null
  minimum_completion_rate_30day?: number | null
  minimum_trade_band?: "bronze" | "silver" | "gold" | "diamond" | null
  visibility_status?: string[]
}
