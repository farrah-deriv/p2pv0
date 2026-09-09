import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { ComplaintForm } from "@/components/complaint/complaint-form"
import { OrdersAPI } from "@/services/api"
import * as useMobileHook from "@/lib/hooks/use-is-mobile"
import jest from "jest" // Import jest to fix the undeclared variable error

// Mock the dependencies
jest.mock("@/services/api")
jest.mock("@/lib/hooks/use-is-mobile")

const mockOrdersAPI = OrdersAPI as jest.Mocked<typeof OrdersAPI>
const mockUseMobile = useMobileHook as jest.Mocked<typeof useMobileHook>

describe("ComplaintForm", () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    onSubmit: jest.fn(),
    orderId: "test-order-123",
    type: "seller" as const,
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseMobile.useIsMobile = jest.fn().mockReturnValue(false)
    mockOrdersAPI.disputeOrder = jest.fn().mockResolvedValue({ success: true })
  })

  it("renders complaint form when open", () => {
    render(<ComplaintForm {...defaultProps} />)

    expect(screen.getByText("Make a complaint")).toBeInTheDocument()
    expect(screen.getByText("I didn't receive any payment")).toBeInTheDocument()
    expect(screen.getByText("I received less than the agreed amount")).toBeInTheDocument()
    expect(screen.getByText("I received more than the agreed amount")).toBeInTheDocument()
    expect(screen.getByText("I received payment from a third party")).toBeInTheDocument()
  })

  it("does not render when closed", () => {
    render(<ComplaintForm {...defaultProps} isOpen={false} />)

    expect(screen.queryByText("Make a complaint")).not.toBeInTheDocument()
  })

  it("calls onClose when back button is clicked", () => {
    render(<ComplaintForm {...defaultProps} />)

    const backButton = screen.getByRole("button", { name: "Go back" })
    fireEvent.click(backButton)

    expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
  })

  it("submit button is disabled until option and checkbox are both set", () => {
    render(<ComplaintForm {...defaultProps} />)

    const submitButton = screen.getByText("Submit")
    expect(submitButton).toBeDisabled()

    // Select an option — still disabled without checkbox
    fireEvent.click(screen.getByText("I didn't receive any payment"))
    expect(submitButton).toBeDisabled()

    // Tick the confirmation checkbox — now enabled
    fireEvent.click(screen.getByRole("checkbox"))
    expect(submitButton).toBeEnabled()
  })

  it("submits complaint with selected option and correct API value", async () => {
    render(<ComplaintForm {...defaultProps} />)

    fireEvent.click(screen.getByText("I didn't receive any payment"))
    fireEvent.click(screen.getByRole("checkbox"))
    fireEvent.click(screen.getByText("Submit"))

    await waitFor(() => {
      expect(mockOrdersAPI.disputeOrder).toHaveBeenCalledWith("test-order-123", "buyer_not_paid")
      expect(defaultProps.onSubmit).toHaveBeenCalledTimes(1)
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
    })
  })

  it("renders on mobile", () => {
    mockUseMobile.useIsMobile.mockReturnValue(true)

    render(<ComplaintForm {...defaultProps} />)

    expect(screen.getByText("Make a complaint")).toBeInTheDocument()
  })

  it("renders on desktop", () => {
    mockUseMobile.useIsMobile.mockReturnValue(false)

    render(<ComplaintForm {...defaultProps} />)

    expect(screen.getByText("Make a complaint")).toBeInTheDocument()
  })

  it("handles API error gracefully", async () => {
    mockOrdersAPI.disputeOrder.mockRejectedValue(new Error("API Error"))

    render(<ComplaintForm {...defaultProps} />)

    fireEvent.click(screen.getByText("I didn't receive any payment"))
    fireEvent.click(screen.getByRole("checkbox"))
    fireEvent.click(screen.getByText("Submit"))

    await waitFor(() => {
      expect(mockOrdersAPI.disputeOrder).toHaveBeenCalled()
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
    })
  })
})
