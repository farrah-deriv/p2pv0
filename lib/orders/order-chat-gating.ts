import type { Order } from "@/services/api/api-orders"
import { isP2POrderChatModerationEnabled } from "@/lib/orders/order-chat-feature-flags"

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

  const role = (order as { role?: "buyer" | "seller" }).role
  if (role === "buyer") return true
  if (role === "seller") return false

  return (
    (order.type === "buy" && idsMatch(order.user?.id, userId)) ||
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
  if (!isP2POrderChatModerationEnabled()) {
    return false
  }

  return canSubmitPaymentProof(order, userId) && !hasBuyerSubmittedPot(order)
}
