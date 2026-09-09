import { fireEvent, render, screen } from "@testing-library/react"
import jest from "jest"
import { PaymentConfirmationSidebar } from "@/app/orders/components/payment-confirmation-sidebar"
import { isP2POrderChatModerationEnabled } from "@/lib/orders/order-chat-feature-flags"
import type { Order } from "@/services/api/api-orders"

jest.mock("@/lib/orders/order-chat-feature-flags", () => ({
  isP2POrderChatModerationEnabled: jest.fn(() => false),
}))

jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: { alt?: string }) => <img alt={props.alt ?? ""} />,
}))

const getChatHistory = jest.fn()
let wsCallback: ((data: unknown) => void) | null = null

jest.mock("@/contexts/websocket-context", () => ({
  useWebSocketContext: () => ({
    isConnected: true,
    getChatHistory,
    subscribe: (callback: (data: unknown) => void) => {
      wsCallback = callback
      return () => {
        wsCallback = null
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
    t: (key: string, params?: { count?: number }) => {
      const map: Record<string, string> = {
        "orders.confirmPayment": "Confirm payment",
        "orders.fraudWarningStart": "Warning",
        "orders.fraudWarningBold": "bold",
        "orders.fraudWarningEnd": "end",
        "orders.amountLabel": "Amount",
        "orders.recipientLabel": "Recipient",
        "orders.receiptMustShow": "Receipt must show",
        "orders.checklistRecipient": "Recipient",
        "orders.checklistAmount": "Amount",
        "orders.checklistDate": "Date",
        "orders.checklistSender": "Sender",
        "orders.uploadProof": "Upload proof",
        "orders.fileTypes": "JPEG, JPG, PNG, PDF",
        "orders.confirmGenuineCheckbox": "I confirm",
        "orders.submit": "Submit",
        "orders.invalidFileType": "Please upload a JPEG, JPG, PNG, or PDF file.",
        "chat.attachmentsRemaining": `Attachments remaining: ${params?.count ?? 0}`,
        "common.close": "Close",
        "common.loading": "Loading",
      }
      return map[key] ?? key
    },
  }),
}))

const mockOrder = {
  id: "order-1",
  type: "buy",
  status: "Pending",
  amount: { value: 100, currency: "USD" },
  rate: { value: "1", currency: "USD" },
  advert: { user: { id: 1, nickname: "seller" } },
  user: { id: 2, nickname: "buyer" },
  price: { value: 100, currency: "USD" },
  paymentMethod: "bank",
  created_at: "2024-01-01",
  expires_at: "2024-01-02",
  payment_currency: "USD",
  payment_amount: "100",
} as Order

const defaultProps = {
  isOpen: true,
  onClose: jest.fn(),
  onConfirm: jest.fn(),
  order: mockOrder,
}

describe("PaymentConfirmationSidebar", () => {
  const originalEnv = process.env.NEXT_PUBLIC_P2P_ORDER_CHAT_MODERATION_ENABLED

  beforeEach(() => {
    jest.clearAllMocks()
    wsCallback = null
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

  describe("when moderation flag is off", () => {
    it("does not show attachment limit counter from websocket", () => {
      render(<PaymentConfirmationSidebar {...defaultProps} />)

      wsCallback?.({
        options: { channel: "orders" },
        payload: { data: { chat_attachments_limit: 3 } },
      })

      expect(screen.queryByText("Attachments remaining: 3")).not.toBeInTheDocument()
    })

    it("does not call getChatHistory when sidebar opens", () => {
      render(<PaymentConfirmationSidebar {...defaultProps} />)

      expect(getChatHistory).not.toHaveBeenCalled()
    })

    it("allows file selection even when websocket reports zero attachments remaining", () => {
      render(<PaymentConfirmationSidebar {...defaultProps} />)

      wsCallback?.({
        options: { channel: "orders" },
        payload: { data: { chat_attachments_limit: 0 } },
      })

      const input = document.getElementById("file-upload") as HTMLInputElement
      const file = new File(["hello"], "proof.png", { type: "image/png" })

      fireEvent.change(input, { target: { files: [file] } })

      expect(screen.getByText("proof.png")).toBeInTheDocument()
    })
  })

  describe("when moderation flag is on", () => {
    beforeEach(() => {
      jest.mocked(isP2POrderChatModerationEnabled).mockReturnValue(true)
    })

    it("updates attachmentsRemaining only for orders channel websocket messages", () => {
      render(<PaymentConfirmationSidebar {...defaultProps} />)

      wsCallback?.({
        options: { channel: "users/me" },
        payload: { data: { chat_attachments_limit: 5 } },
      })

      expect(screen.queryByText("Attachments remaining: 5")).not.toBeInTheDocument()

      wsCallback?.({
        options: { channel: "orders" },
        payload: { data: { chat_attachments_limit: 3 } },
      })

      expect(screen.getByText("Attachments remaining: 3")).toBeInTheDocument()
    })

    it("calls getChatHistory when sidebar opens while connected", () => {
      render(<PaymentConfirmationSidebar {...defaultProps} />)

      expect(getChatHistory).toHaveBeenCalledWith("orders", "order-1")
    })

    it("blocks file selection when attachmentsRemaining is zero", () => {
      render(<PaymentConfirmationSidebar {...defaultProps} />)

      wsCallback?.({
        options: { channel: "orders" },
        payload: { data: { chat_attachments_limit: 0 } },
      })

      const input = document.getElementById("file-upload") as HTMLInputElement
      const file = new File(["hello"], "proof.png", { type: "image/png" })

      fireEvent.change(input, { target: { files: [file] } })

      expect(screen.queryByText("proof.png")).not.toBeInTheDocument()
    })

    it("shows error styling when attachmentsRemaining is zero", () => {
      render(<PaymentConfirmationSidebar {...defaultProps} />)

      wsCallback?.({
        options: { channel: "orders" },
        payload: { data: { chat_attachments_limit: 0 } },
      })

      const counter = screen.getByText("Attachments remaining: 0")
      expect(counter).toHaveClass("text-error-text")
    })

    it("resets attachmentsRemaining when sidebar closes", () => {
      const { rerender } = render(<PaymentConfirmationSidebar {...defaultProps} />)

      wsCallback?.({
        options: { channel: "orders" },
        payload: { data: { chat_attachments_limit: 2 } },
      })

      expect(screen.getByText("Attachments remaining: 2")).toBeInTheDocument()

      rerender(<PaymentConfirmationSidebar {...defaultProps} isOpen={false} />)
      rerender(<PaymentConfirmationSidebar {...defaultProps} isOpen={true} />)

      expect(screen.queryByText("Attachments remaining: 2")).not.toBeInTheDocument()
    })

    it("shows invalid file type error for unsupported files", () => {
      render(<PaymentConfirmationSidebar {...defaultProps} />)

      const input = document.getElementById("file-upload") as HTMLInputElement
      const file = new File(["hello"], "proof.txt", { type: "text/plain" })

      fireEvent.change(input, { target: { files: [file] } })

      expect(
        screen.getByText("Please upload a JPEG, JPG, PNG, or PDF file."),
      ).toBeInTheDocument()
    })
  })
})
