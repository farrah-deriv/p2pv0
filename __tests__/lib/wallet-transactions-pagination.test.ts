import {
  extractWalletTransactionsNextCursor,
  flattenWalletTransactionPages,
} from "@/lib/wallet-transactions-pagination"

describe("extractWalletTransactionsNextCursor", () => {
  it("reads page_cursor from links.next URL", () => {
    const cursor = extractWalletTransactionsNextCursor({
      data: { transactions: [] },
      links: {
        next:
          "https://api.example.com/v1/wallets/w1/transactions?page_cursor=cursor_xyz&per_page=25",
      },
    })

    expect(cursor).toBe("cursor_xyz")
  })

  it("returns null when links.next is absent", () => {
    expect(
      extractWalletTransactionsNextCursor({ data: { transactions: [] } }),
    ).toBeNull()
  })

  it("falls back to metadata.page_cursor", () => {
    const cursor = extractWalletTransactionsNextCursor({
      data: { transactions: [] },
      metadata: { page_cursor: "legacy_cursor" },
    })

    expect(cursor).toBe("legacy_cursor")
  })
})

describe("flattenWalletTransactionPages", () => {
  it("concatenates transactions across pages", () => {
    const flat = flattenWalletTransactionPages({
      pages: [
        { transactions: [{ id: 1 }], nextCursor: "a" },
        { transactions: [{ id: 2 }], nextCursor: null },
      ],
    })

    expect(flat).toEqual([{ id: 1 }, { id: 2 }])
  })
})
