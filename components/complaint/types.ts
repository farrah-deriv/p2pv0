export interface ComplaintOption {
  id: string
  value: string
  labelKey: string
  label: string
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
    label: "I didn't receive any payment",
    type: "seller",
    hintKey: "buyer_not_paid_hint",
  },
  {
    id: "seller-buyer-underpaid",
    value: "buyer_underpaid",
    labelKey: "buyer_underpaid",
    label: "I received less than the agreed amount",
    type: "seller",
    hintKey: "buyer_underpaid_hint",
  },
  {
    id: "seller-buyer-overpaid",
    value: "buyer_overpaid",
    labelKey: "buyer_overpaid",
    label: "I received more than the agreed amount",
    type: "seller",
    hintKey: "buyer_overpaid_hint",
  },
  {
    id: "seller-third-party",
    value: "buyer_third_party_payment_method",
    labelKey: "buyer_third_party_payment_method",
    label: "I received payment from a third party",
    type: "seller",
    hintKey: "buyer_third_party_payment_method_hint",
  },
  {
    id: "buyer-seller-not-released",
    value: "seller_not_released",
    labelKey: "seller_not_released",
    label: "I made the payment, but the seller hasn't released the funds",
    type: "buyer",
    hintKey: "seller_not_released_hint",
  },
  {
    id: "buyer-underpaid",
    value: "buyer_underpaid",
    labelKey: "buyer_underpaid_buyer",
    label: "I couldn't complete the full payment",
    type: "buyer",
    hintKey: "buyer_underpaid_buyer_hint",
  },
  {
    id: "buyer-overpaid",
    value: "buyer_overpaid",
    labelKey: "buyer_overpaid_buyer",
    label: "I paid more than the agreed amount",
    type: "buyer",
    hintKey: "buyer_overpaid_buyer_hint",
  },
]
