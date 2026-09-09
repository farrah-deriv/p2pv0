export interface ComplaintOption {
  id: string
  value: string
  labelKey: string
  type: string
  hintKey: string
}

export interface ComplaintProps {
  isOpen: boolean
  onClose: () => void
  onSubmit?: () => void
  orderId: string
  type: "buyer" | "seller"
}

export const COMPLAINT_OPTIONS: ComplaintOption[] = [
  {
    id: "seller-buyer-not-paid",
    value: "buyer_not_paid",
    labelKey: "buyer_not_paid",
    type: "seller",
    hintKey: "buyer_not_paid_hint",
  },
  {
    id: "seller-buyer-underpaid",
    value: "buyer_underpaid",
    labelKey: "buyer_underpaid",
    type: "seller",
    hintKey: "buyer_underpaid_hint",
  },
  {
    id: "seller-buyer-overpaid",
    value: "buyer_overpaid",
    labelKey: "buyer_overpaid",
    type: "seller",
    hintKey: "buyer_overpaid_hint",
  },
  {
    id: "seller-third-party",
    value: "buyer_third_party_payment_method",
    labelKey: "buyer_third_party_payment_method",
    type: "seller",
    hintKey: "buyer_third_party_payment_method_hint",
  },
  {
    id: "buyer-seller-not-released",
    value: "seller_not_released",
    labelKey: "seller_not_released",
    type: "buyer",
    hintKey: "seller_not_released_hint",
  },
  {
    id: "buyer-underpaid",
    value: "buyer_underpaid",
    labelKey: "buyer_underpaid_buyer",
    type: "buyer",
    hintKey: "buyer_underpaid_buyer_hint",
  },
  {
    id: "buyer-overpaid",
    value: "buyer_overpaid",
    labelKey: "buyer_overpaid_buyer",
    type: "buyer",
    hintKey: "buyer_overpaid_buyer_hint",
  },
]
