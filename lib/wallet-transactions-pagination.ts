/** Page size for `GET /v1/wallets/transactions` — matches mobile / portfolio. */
export const WALLET_TRANSACTIONS_PAGE_SIZE = 25

export interface WalletTransactionsPageResult {
  transactions: unknown[]
  nextCursor: string | null
}

/**
 * Reads the next-page cursor from the wallet transactions API response.
 *
 * Primary: `links.next` URL query param `page_cursor` (canonical).
 * Fallback: `metadata.page_cursor` for older shapes.
 */
export function extractWalletTransactionsNextCursor(
  data: Record<string, unknown>,
): string | null {
  const links = data.links
  if (links && typeof links === "object") {
    const next = (links as { next?: unknown }).next
    if (typeof next === "string" && next.length > 0) {
      try {
        const cursor = new URL(next).searchParams.get("page_cursor")
        if (cursor) return cursor
      } catch {
        const cursor = new URL(next, "https://placeholder.local").searchParams.get(
          "page_cursor",
        )
        if (cursor) return cursor
      }
    }
  }

  const metadata = data.metadata
  if (metadata && typeof metadata === "object") {
    const cursor = (metadata as { page_cursor?: unknown }).page_cursor
    if (typeof cursor === "string" && cursor.length > 0) return cursor
  }

  return null
}

export function flattenWalletTransactionPages(
  data: { pages: WalletTransactionsPageResult[] } | undefined,
): unknown[] {
  return data?.pages.flatMap((page) => page.transactions) ?? []
}
