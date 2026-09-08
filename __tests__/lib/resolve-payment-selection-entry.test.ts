import { resolvePaymentSelectionEntry } from "@/lib/payment-methods/payment-method-selection-utils"

const bank = { id: "1", method: "bank_transfer" }
const skrill = { id: "2", method: "skrill" }
const neteller = { id: "3", method: "neteller" }

/** Advert form: every saved method is eligible, the advert has no accepted list yet. */
const advertForm = (methods: typeof bank[], overrides = {}) =>
  resolvePaymentSelectionEntry({
    isLoading: false,
    hasNextPage: false,
    methods,
    eligibleMethods: methods,
    ...overrides,
  })

/** Place order: only methods the advert accepts are eligible. */
const placeOrder = (
  methods: typeof bank[],
  eligibleMethods: typeof bank[],
  overrides = {},
) =>
  resolvePaymentSelectionEntry({
    isLoading: false,
    hasNextPage: false,
    methods,
    eligibleMethods,
    ...overrides,
  })

describe("resolvePaymentSelectionEntry", () => {
  describe("create/edit sell advert", () => {
    it("opens the catalogue when the user has zero saved methods", () => {
      expect(advertForm([])).toBe("catalogue")
    })

    it("opens the normal selection sheet when the user has saved methods", () => {
      expect(advertForm([bank])).toBe("selection")
    })

    it("waits instead of deciding empty while the first page is still loading", () => {
      expect(advertForm([], { isLoading: true })).toBe("loading")
    })
  })

  describe("place order (user is the seller)", () => {
    it("opens the catalogue when the user has no saved methods at all", () => {
      expect(placeOrder([], [])).toBe("catalogue")
    })

    it("opens the catalogue when saved methods exist but none match the advert", () => {
      expect(placeOrder([skrill, neteller], [])).toBe("catalogue")
    })

    it("opens the normal selection sheet when a compatible method is on page 1", () => {
      expect(placeOrder([skrill, bank], [bank])).toBe("selection")
    })

    it("keeps loading while a compatible method may still be on a later page", () => {
      // Page 1 is full of incompatible methods and more pages remain — skipping
      // to the catalogue here would hide a compatible method the user has.
      expect(placeOrder([skrill, neteller], [], { hasNextPage: true })).toBe("loading")
    })

    it("opens the selection sheet once a later page yields a compatible method", () => {
      expect(placeOrder([skrill, neteller, bank], [bank], { hasNextPage: false })).toBe(
        "selection",
      )
    })

    it("opens the catalogue once pagination is exhausted with nothing compatible", () => {
      expect(placeOrder([skrill, neteller], [], { hasNextPage: false })).toBe("catalogue")
    })

    it("does not paginate when the unfiltered first page is already empty", () => {
      // A short/empty first page cannot be followed by more results.
      expect(placeOrder([], [], { hasNextPage: false })).toBe("catalogue")
    })

    it("waits instead of deciding empty while the first page is still loading", () => {
      expect(placeOrder([], [], { isLoading: true })).toBe("loading")
    })
  })

  describe("existing selection", () => {
    it("keeps the selection sheet when amending a non-empty selection", () => {
      // The user is amending a selection, not starting from nothing, so the
      // catalogue skip must not fire even if the live eligible list is empty.
      expect(placeOrder([], [], { currentSelection: ["7"] })).toBe("selection")
    })

    it("ignores blank ids when deciding whether a selection exists", () => {
      expect(placeOrder([], [], { currentSelection: [""] })).toBe("catalogue")
    })

    it("prefers the existing selection over a still-loading list", () => {
      expect(placeOrder([], [], { currentSelection: ["7"], isLoading: true })).toBe(
        "selection",
      )
    })
  })
})
