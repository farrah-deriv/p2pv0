import { fireEvent, render, screen } from "@testing-library/react"
import OrderChat from "@/components/order-chat"
import { isP2POrderChatModerationEnabled } from "@/lib/orders/order-chat-feature-flags"

jest.mock("@/lib/orders/order-chat-feature-flags", () => ({
  isP2POrderChatModerationEnabled: jest.fn(() => false),
}))

jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: { alt?: string }) => <img alt={props.alt ?? ""} />,
}))

jest.mock("@/contexts/websocket-context", () => ({
  useWebSocketContext: () => ({
    isConnected: false,
    getChatHistory: jest.fn(),
    subscribe: () => () => {},
  }),
}))

jest.mock("@/hooks/use-alert-dialog", () => ({
  useAlertDialog: () => ({ showAlert: jest.fn() }),
}))

jest.mock("@/lib/i18n/use-translations", () => ({
  useTranslations: () => ({
    locale: "en",
    t: (key: string) =>
      ({
        "chat.disclaimerImportant": "Important:",
        "chat.disclaimerText": "Disclaimer",
        "chat.disclaimerNote": "Note:",
        "chat.disclaimerNoteText": "Note text",
        "chat.enterMessage": "Enter message",
        "chat.conversationClosed": "Closed",
        "chat.attachmentUploadRequiresPot":
          "Pay for this order and upload proof of transfer before uploading other attachments.",
        "common.sendMessage": "Send",
        "common.back": "Back",
        "chat.online": "Online",
      })[key] ?? key,
  }),
}))

jest.mock("@/components/presence-last-seen", () => ({
  PresenceLastSeen: () => null,
}))

jest.mock("@/stores/user-data-store", () => ({
  useUserDataStore: (selector: (state: { userId: number }) => unknown) =>
    selector({ userId: 1 }),
}))

import type { Order } from "@/services/api/api-orders"

const pendingPaymentOrder = {
  id: "123",
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
  has_buyer_submitted_pot: false,
} as Order

describe("OrderChat attachment gating", () => {
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

  it("shows disabled attach button with guidance tooltip when upload is blocked and flag is on", () => {
    jest.mocked(isP2POrderChatModerationEnabled).mockReturnValue(true)

    render(
      <OrderChat
        orderId="123"
        counterpartyName="Seller"
        counterpartyInitial="S"
        isClosed={false}
        order={pendingPaymentOrder}
      />,
    )

    const attachButton = screen.getByTestId("order-chat-btn-attach")
    expect(attachButton).toHaveClass("opacity-40")

    fireEvent.click(attachButton)
    expect(
      screen.getByText(
        "Pay for this order and upload proof of transfer before uploading other attachments.",
      ),
    ).toBeInTheDocument()
  })

  it("keeps attach enabled for pending POT buyer when moderation flag is off", () => {
    render(
      <OrderChat
        orderId="123"
        counterpartyName="Seller"
        counterpartyInitial="S"
        isClosed={false}
        order={pendingPaymentOrder}
      />,
    )

    const attachButton = screen.getByTestId("order-chat-btn-attach")
    expect(attachButton).not.toHaveClass("opacity-40")
    expect(attachButton).not.toBeDisabled()
  })

  it("shows disabled attach button when isAttachmentUploadDisabled is true regardless of flag", () => {
    render(
      <OrderChat
        orderId="123"
        counterpartyName="Seller"
        counterpartyInitial="S"
        isClosed={false}
        isAttachmentUploadDisabled
      />,
    )

    const attachButton = screen.getByTestId("order-chat-btn-attach")
    expect(attachButton).toHaveClass("opacity-40")

    fireEvent.click(attachButton)
    expect(
      screen.getByText(
        "Pay for this order and upload proof of transfer before uploading other attachments.",
      ),
    ).toBeInTheDocument()
  })
})
