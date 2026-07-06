import type { Order } from "@/services/api/api-orders"

function idsMatch(
  left: number | string | null | undefined,
  right: number | string | null | undefined,
): boolean {
  if (left == null || right == null) return false
  return String(left) === String(right)
}

export function isOrderBuyer(
  order: Order,
  userId: number | string | null | undefined,
): boolean {
  if (userId == null || userId === "") return false

  return (
    (order.type === "buy" && idsMatch(order.user.id, userId)) ||
    (order.type === "sell" && idsMatch(order.advert?.user?.id, userId))
  )
}

export function canSubmitPaymentProof(
  order: Order,
  userId: number | string | null | undefined,
): boolean {
  return isOrderBuyer(order, userId) && order.status === "pending_payment"
}

export function hasBuyerSubmittedPot(order: Order): boolean {
  return order.has_buyer_submitted_pot === true
}

export function shouldDisableChatAttachments(
  order: Order,
  userId: number | string | null | undefined,
): boolean {
  return canSubmitPaymentProof(order, userId) && !hasBuyerSubmittedPot(order)
}
