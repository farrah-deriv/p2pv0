import {
  canSubmitPaymentProof,
  hasBuyerSubmittedPot,
  isOrderBuyer,
  shouldDisableChatAttachments,
} from "@/lib/orders/order-chat-gating"
import { isP2POrderChatModerationEnabled } from "@/lib/orders/order-chat-feature-flags"
import { Order } from "@/services/api/api-orders"

jest.mock("@/lib/orders/order-chat-feature-flags", () => ({
  isP2POrderChatModerationEnabled: jest.fn(() => false),
}))

const baseOrder = {
  id: "1",
  type: "buy",
  status: "pending_payment",
  amount: { value: 100, currency: "USD" },
  rate: { value: "1", currency: "USD" },
  advert: { user: { id: 2, nickname: "Seller" } },
  user: { id: 1, nickname: "Buyer" },
  price: { value: 100, currency: "USD" },
  paymentMethod: "bank",
  created_at: "2024-01-01",
  expires_at: "2024-01-02",
  payment_currency: "USD",
  payment_amount: "100",
  is_reviewable: false,
  rating: 0,
} as Order

describe("order-chat-gating", () => {
  const originalEnv = process.env.NEXT_PUBLIC_P2P_ORDER_CHAT_MODERATION_ENABLED

  beforeEach(() => {
    delete process.env.NEXT_PUBLIC_P2P_ORDER_CHAT_MODERATION_ENABLED
    jest.mocked(isP2POrderChatModerationEnabled).mockReturnValue(false)
  })

  afterAll(() => {
    if (originalEnv === undefined) {
      delete process.env.NEXT_PUBLIC_P2P_ORDER_CHAT_MODERATION_ENABLED
    } else {
      process.env.NEXT_PUBLIC_P2P_ORDER_CHAT_MODERATION_ENABLED = originalEnv
    }
  })

  describe("isOrderBuyer", () => {
    it("returns true for buy order when current user is order.user", () => {
      expect(isOrderBuyer(baseOrder, 1)).toBe(true)
    })

    it("returns true for sell order when current user is advert owner", () => {
      expect(
        isOrderBuyer(
          {
            ...baseOrder,
            type: "sell",
            user: { id: 2, nickname: "Buyer" },
            advert: { user: { id: 1, nickname: "Seller" } },
          },
          1,
        ),
      ).toBe(true)
    })

    it("returns true for buy order when current user is order.user as string id", () => {
      expect(isOrderBuyer(baseOrder, "1")).toBe(true)
    })

    it("returns false for seller on buy order", () => {
      expect(isOrderBuyer(baseOrder, 2)).toBe(false)
    })

    it("returns false for sell order when advert user is absent", () => {
      const order = {
        ...baseOrder,
        type: "sell" as const,
        advert: {},
      } as Order

      expect(isOrderBuyer(order, 1)).toBe(false)
    })
  })

  describe("shouldDisableChatAttachments", () => {
    it("is false when moderation flag is off regardless of POT state", () => {
      expect(
        shouldDisableChatAttachments(
          { ...baseOrder, has_buyer_submitted_pot: false },
          "1",
        ),
      ).toBe(false)
    })

    it("is true for buyer in pending payment with has_buyer_submitted_pot false when flag is on", () => {
      jest.mocked(isP2POrderChatModerationEnabled).mockReturnValue(true)

      expect(
        shouldDisableChatAttachments(
          { ...baseOrder, has_buyer_submitted_pot: false },
          "1",
        ),
      ).toBe(true)
    })

    it("is false when has_buyer_submitted_pot is true and flag is on", () => {
      jest.mocked(isP2POrderChatModerationEnabled).mockReturnValue(true)

      expect(
        shouldDisableChatAttachments(
          { ...baseOrder, has_buyer_submitted_pot: true },
          1,
        ),
      ).toBe(false)
    })

    it("is true when has_buyer_submitted_pot is absent and flag is on", () => {
      jest.mocked(isP2POrderChatModerationEnabled).mockReturnValue(true)

      expect(shouldDisableChatAttachments(baseOrder, 1)).toBe(true)
    })

    it("is false for seller even when has_buyer_submitted_pot is false and flag is on", () => {
      jest.mocked(isP2POrderChatModerationEnabled).mockReturnValue(true)

      expect(
        shouldDisableChatAttachments(
          { ...baseOrder, has_buyer_submitted_pot: false },
          2,
        ),
      ).toBe(false)
    })

    it("is false when order is not pending payment and flag is on", () => {
      jest.mocked(isP2POrderChatModerationEnabled).mockReturnValue(true)

      expect(
        shouldDisableChatAttachments(
          {
            ...baseOrder,
            status: "pending_release",
            has_buyer_submitted_pot: false,
          },
          1,
        ),
      ).toBe(false)
    })
  })

  describe("canSubmitPaymentProof", () => {
    it("matches buyer pending payment state", () => {
      expect(canSubmitPaymentProof(baseOrder, 1)).toBe(true)
      expect(canSubmitPaymentProof(baseOrder, 2)).toBe(false)
    })
  })

  describe("hasBuyerSubmittedPot", () => {
    it("is true only when field is explicitly true", () => {
      expect(hasBuyerSubmittedPot({ ...baseOrder, has_buyer_submitted_pot: true })).toBe(true)
      expect(hasBuyerSubmittedPot({ ...baseOrder, has_buyer_submitted_pot: false })).toBe(false)
      expect(hasBuyerSubmittedPot(baseOrder)).toBe(false)
    })
  })
})
