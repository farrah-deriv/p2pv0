import {
  formatOrderCounterparty,
  getOrderParties,
  isOrderStatement,
  type OrderStatementMetadata,
} from "@/lib/wallet/order-parties"

// Funds for a P2P order always move from the seller's P2P wallet to the
// buyer's, so From/To must not depend on `order_type` (a role, not a
// direction). Regression cover for the swapped From/To on buy orders.
const buyOrder: OrderStatementMetadata = {
  order_type: "buy",
  buyer_nickname: "alice_buyer",
  seller_nickname: "bob_seller",
}

const sellOrder: OrderStatementMetadata = {
  order_type: "sell",
  buyer_nickname: "alice_buyer",
  seller_nickname: "bob_seller",
}

describe("getOrderParties", () => {
  it("resolves From to the seller and To to the buyer on a buy order", () => {
    expect(getOrderParties(buyOrder)).toEqual({ from: "bob_seller", to: "alice_buyer" })
  })

  it("resolves From to the seller and To to the buyer on a sell order", () => {
    expect(getOrderParties(sellOrder)).toEqual({ from: "bob_seller", to: "alice_buyer" })
  })

  it("resolves the same pair for both order types", () => {
    expect(getOrderParties(buyOrder)).toEqual(getOrderParties(sellOrder))
  })

  it("returns null for a non-order row so wallet-type handling still applies", () => {
    expect(getOrderParties(undefined)).toBeNull()
    expect(getOrderParties({})).toBeNull()
  })

  it("renders an absent buyer nickname as empty rather than undefined", () => {
    expect(getOrderParties({ order_type: "buy", seller_nickname: "bob_seller" })).toEqual({
      from: "bob_seller",
      to: "",
    })
  })

  it("renders an absent seller nickname as empty rather than undefined", () => {
    expect(getOrderParties({ order_type: "sell", buyer_nickname: "alice_buyer" })).toEqual({
      from: "",
      to: "alice_buyer",
    })
  })
})

describe("formatOrderCounterparty", () => {
  it("points the arrow from seller to buyer on a buy order", () => {
    expect(formatOrderCounterparty(buyOrder)).toBe("bob_seller → alice_buyer")
  })

  it("points the arrow from seller to buyer on a sell order", () => {
    expect(formatOrderCounterparty(sellOrder)).toBe("bob_seller → alice_buyer")
  })

  it("agrees with the From/To pair shown in the details panel", () => {
    for (const metadata of [buyOrder, sellOrder]) {
      const parties = getOrderParties(metadata)
      expect(formatOrderCounterparty(metadata)).toBe(`${parties?.from} → ${parties?.to}`)
    }
  })

  it("never renders the literal undefined when a nickname is missing", () => {
    expect(formatOrderCounterparty({ order_type: "buy" })).toBe(" → ")
    expect(formatOrderCounterparty({ order_type: "sell", seller_nickname: "bob_seller" })).toBe(
      "bob_seller → ",
    )
  })
})

describe("isOrderStatement", () => {
  it("recognises both order types and nothing else", () => {
    expect(isOrderStatement({ order_type: "buy" })).toBe(true)
    expect(isOrderStatement({ order_type: "sell" })).toBe(true)
    expect(isOrderStatement({})).toBe(false)
    expect(isOrderStatement(undefined)).toBe(false)
  })
})
