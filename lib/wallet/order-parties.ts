/**
 * From/To resolution for P2P order rows in the wallet statement.
 *
 * `statement_metadata` carries absolute role identities (`buyer_nickname`,
 * `seller_nickname`) alongside `order_type`, which is a role rather than a
 * direction. Deriving the money direction from that role is what produced the
 * swapped From/To pair, so it is deliberately not read here.
 */

/** Structural shape of `Transaction["metadata"]["statement_metadata"]`. */
export interface OrderStatementMetadata {
  order_type?: "buy" | "sell"
  buyer_nickname?: string
  seller_nickname?: string
}

/** True when the statement row describes a P2P order rather than a wallet movement. */
export function isOrderStatement(metadata: OrderStatementMetadata | undefined): boolean {
  return metadata?.order_type === "buy" || metadata?.order_type === "sell"
}

/**
 * The two ends of an order's settlement, or `null` when the row is not an
 * order (so callers fall through to their source/destination wallet handling).
 */
export function getOrderParties(
  metadata: OrderStatementMetadata | undefined,
): { from: string; to: string } | null {
  if (!isOrderStatement(metadata)) return null
  return {
    from: metadata?.seller_nickname ?? "",
    to: metadata?.buyer_nickname ?? "",
  }
}

/** `<from> → <to>` for an order row's list subtitle. */
export function formatOrderCounterparty(metadata: OrderStatementMetadata | undefined): string {
  const parties = getOrderParties(metadata)
  if (!parties) return ""
  return `${parties.from} → ${parties.to}`
}
