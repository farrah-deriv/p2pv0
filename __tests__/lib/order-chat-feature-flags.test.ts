import { isP2POrderChatModerationEnabled } from "@/lib/orders/order-chat-feature-flags"

describe("isP2POrderChatModerationEnabled", () => {
  const originalEnv = process.env.NEXT_PUBLIC_P2P_ORDER_CHAT_MODERATION_ENABLED

  beforeEach(() => {
    delete process.env.NEXT_PUBLIC_P2P_ORDER_CHAT_MODERATION_ENABLED
  })

  afterAll(() => {
    if (originalEnv === undefined) {
      delete process.env.NEXT_PUBLIC_P2P_ORDER_CHAT_MODERATION_ENABLED
    } else {
      process.env.NEXT_PUBLIC_P2P_ORDER_CHAT_MODERATION_ENABLED = originalEnv
    }
  })

  it("returns false when env is unset", () => {
    expect(isP2POrderChatModerationEnabled()).toBe(false)
  })

  it("returns false when env is not 1", () => {
    process.env.NEXT_PUBLIC_P2P_ORDER_CHAT_MODERATION_ENABLED = "0"

    expect(isP2POrderChatModerationEnabled()).toBe(false)
  })

  it("returns true when env is 1", () => {
    process.env.NEXT_PUBLIC_P2P_ORDER_CHAT_MODERATION_ENABLED = "1"

    expect(isP2POrderChatModerationEnabled()).toBe(true)
  })
})
