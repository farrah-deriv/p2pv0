import { act, render, screen, waitFor } from "@testing-library/react"
import OrderChat from "@/components/order-chat"

const mockGetChatHistory = jest.fn()
const mockMarkChatMessagesRead = jest.fn(() => true)
let mockSubscriber: ((data: Record<string, unknown>) => void) | undefined
let mockIsConnected = true

jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: { alt?: string }) => <img alt={props.alt ?? ""} />,
}))

jest.mock("@/contexts/websocket-context", () => ({
  useWebSocketContext: () => ({
    isConnected: mockIsConnected,
    getChatHistory: mockGetChatHistory,
    markChatMessagesRead: mockMarkChatMessagesRead,
    subscribe: (callback: (data: Record<string, unknown>) => void) => {
      mockSubscriber = callback
      return () => {
        mockSubscriber = undefined
      }
    },
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
        "chat.disclaimerNoteItem2": "Only attach files relevant to this order.",
        "chat.enterMessage": "Enter message",
        "chat.conversationClosed": "Closed",
        "chat.messageStatusRead": "Read",
        "chat.messageStatusSent": "Sent",
        "chat.online": "Online",
        "common.sendMessage": "Send",
        "common.back": "Back",
      })[key] ?? key,
  }),
}))

jest.mock("@/components/presence-last-seen", () => ({
  PresenceLastSeen: () => null,
}))

jest.mock("@/stores/user-data-store", () => ({
  useUserDataStore: (selector: (state: { userId: number }) => unknown) => selector({ userId: 1 }),
}))

function renderOrderChat() {
  return render(
    <OrderChat
      orderId="123"
      counterpartyName="Seller"
      counterpartyInitial="S"
      isClosed={false}
    />,
  )
}

function emitChatEvent(data: Record<string, unknown>) {
  act(() => {
    mockSubscriber?.({ options: { channel: "orders" }, payload: { data } })
  })
}

describe("OrderChat read receipts", () => {
  beforeEach(() => {
    mockGetChatHistory.mockReset()
    mockMarkChatMessagesRead.mockClear()
    mockMarkChatMessagesRead.mockReturnValue(true)
    mockIsConnected = true
    mockSubscriber = undefined
  })

  it("shows a single sent tick, then double read ticks after the socket receipt", async () => {
    renderOrderChat()

    emitChatEvent({
      chat_history: [
        { id: "sent-message", message: "Hello", sender_is_self: true, is_read: false, time: 1723872000000 },
      ],
    })

    const receipt = await screen.findByTestId("order-chat-receipt-sent-message")
    expect(receipt).toHaveAttribute("aria-label", "Sent")
    expect(receipt.querySelectorAll("svg")).toHaveLength(1)

    emitChatEvent({ chat_messages_read: true, order_id: "123" })

    await waitFor(() => expect(receipt).toHaveAttribute("aria-label", "Read"))
    expect(receipt).toHaveClass("text-blue-800")
    expect(receipt.querySelectorAll("svg")).toHaveLength(2)
  })

  it("acknowledges unread counterparty history once it loads", async () => {
    renderOrderChat()

    emitChatEvent({
      chat_history: [
        { id: "received-message", message: "Hello", sender_is_self: false, is_read: false, time: 1723872000000 },
      ],
    })

    await waitFor(() =>
      expect(mockMarkChatMessagesRead).toHaveBeenCalledWith("orders", "123", "received-message"),
    )
  })

  it("acknowledges unread counterparty live messages without sender_is_self", async () => {
    renderOrderChat()

    emitChatEvent({
      order_id: "123",
      message: "Hello",
      time: 1723872000000,
    })

    await waitFor(() =>
      expect(mockMarkChatMessagesRead).toHaveBeenCalledWith("orders", "123", expect.any(String)),
    )
  })

  it("does not acknowledge self-sent messages", () => {
    renderOrderChat()

    emitChatEvent({
      order_id: "123",
      message: "Hello",
      sender_is_self: true,
      is_read: false,
      time: 1723872000000,
    })

    expect(mockMarkChatMessagesRead).not.toHaveBeenCalled()
  })

  it("acknowledges unread counterparty messages when window gains focus", async () => {
    renderOrderChat()

    emitChatEvent({
      chat_history: [
        { id: "unread-cp", message: "Hi", sender_is_self: false, is_read: false, time: 1723872000000 },
      ],
    })

    await waitFor(() => expect(mockMarkChatMessagesRead).toHaveBeenCalledTimes(1))
    mockMarkChatMessagesRead.mockClear()

    emitChatEvent({
      order_id: "123",
      message: "Another one",
      time: 1723872001000,
    })

    await waitFor(() => expect(mockMarkChatMessagesRead).toHaveBeenCalledTimes(1))
    mockMarkChatMessagesRead.mockClear()

    act(() => window.dispatchEvent(new Event("focus")))

    expect(mockMarkChatMessagesRead).not.toHaveBeenCalled()
  })
})
