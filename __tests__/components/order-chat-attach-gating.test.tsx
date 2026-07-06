import { fireEvent, render, screen } from "@testing-library/react"
import OrderChat from "@/components/order-chat"

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

describe("OrderChat attachment gating", () => {
  it("shows disabled attach button with guidance tooltip when upload is blocked", () => {
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
