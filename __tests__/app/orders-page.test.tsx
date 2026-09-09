import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { useRouter } from "next/navigation"
import OrdersPage from "@/app/orders/page"
import { useOrdersFilterStore } from "@/stores/orders-filter-store"
import { OrdersAPI } from "@/services/api"
import { useWebSocketContext } from "@/contexts/websocket-context"
import { useIsMobile } from "@/hooks/use-mobile"
import jest from "jest" // Import jest to fix the undeclared variable error

// Mock dependencies
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}))

jest.mock("@/stores/orders-filter-store")
jest.mock("@/services/api")
jest.mock("@/contexts/websocket-context")
jest.mock("@/hooks/use-mobile")
jest.mock("@/components/navigation", () => {
  return function MockNavigation() {
    return <div data-testid="navigation">Navigation</div>
  }
})
jest.mock("@/components/order-chat", () => {
  return function MockOrderChat() {
    return <div data-testid="order-chat">Order Chat</div>
  }
})
jest.mock("@/components/empty-state", () => {
  return function MockEmptyState() {
    return <div data-testid="empty-state">Empty State</div>
  }
})
jest.mock("@/components/rating-filter/rating-sidebar", () => ({
  RatingSidebar: function MockRatingSidebar() {
    return <div data-testid="rating-sidebar">Rating Sidebar</div>
  },
}))

const mockRouter = {
  push: jest.fn(),
}

const mockWebSocketContext = {
  joinChannel: jest.fn(),
}

const mockOrdersFilterStore = {
  activeTab: "active",
  setActiveTab: jest.fn(),
}

const mockOrdersData = {
  data: [
    {
      id: "1",
      type: "buy",
      amount: "100",
      status: "pending_payment",
      created_at: "2023-01-01",
      expires_at: "2023-01-02",
      rating: 0,
      is_reviewable: 0,
      payment_amount: "1000",
      advert: {
        account_currency: "USD",
        payment_currency: "MYR",
        user: {
          id: "2",
          nickname: "seller123",
        },
      },
      user: {
        id: "1",
        nickname: "buyer123",
      },
    },
  ],
}

describe("OrdersPage", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
    ;(useOrdersFilterStore as jest.Mock).mockReturnValue(mockOrdersFilterStore)
    ;(useWebSocketContext as jest.Mock).mockReturnValue(mockWebSocketContext)
    ;(useIsMobile as jest.Mock).mockReturnValue(false)
    ;(OrdersAPI.getOrders as jest.Mock).mockResolvedValue(mockOrdersData)
  })

  it("should render orders page with tabs", async () => {
    render(<OrdersPage />)

    await waitFor(() => {
      expect(screen.getByText("Active orders")).toBeInTheDocument()
      expect(screen.getByText("Past orders")).toBeInTheDocument()
    })
  })

  it("should use Zustand store for active tab state", async () => {
    render(<OrdersPage />)

    await waitFor(() => {
      expect(useOrdersFilterStore).toHaveBeenCalled()
    })
  })

  it("should call setActiveTab when tab is changed", async () => {
    render(<OrdersPage />)

    const pastTab = screen.getByText("Past orders")
    fireEvent.click(pastTab)

    expect(mockOrdersFilterStore.setActiveTab).toHaveBeenCalledWith("past")
  })

  it("should fetch orders when activeTab changes", async () => {
    const { rerender } = render(<OrdersPage />)

    // Initial fetch for active tab
    await waitFor(() => {
      expect(OrdersAPI.getOrders).toHaveBeenCalledWith({ is_open: true })
    })

    // Change to past tab
    mockOrdersFilterStore.activeTab = "past"
    rerender(<OrdersPage />)

    await waitFor(() => {
      expect(OrdersAPI.getOrders).toHaveBeenCalledWith({ is_open: false })
    })
  })

  it("should display loading state initially", () => {
    ;(OrdersAPI.getOrders as jest.Mock).mockImplementation(() => new Promise(() => {}))

    render(<OrdersPage />)

    expect(screen.getByText("Loading orders...")).toBeInTheDocument()
  })

  it("should display error state when API fails", async () => {
    ;(OrdersAPI.getOrders as jest.Mock).mockRejectedValue(new Error("API Error"))

    render(<OrdersPage />)

    await waitFor(() => {
      expect(screen.getByText("Failed to load orders. Please try again.")).toBeInTheDocument()
    })
  })

  it("should display empty state when no orders", async () => {
    ;(OrdersAPI.getOrders as jest.Mock).mockResolvedValue({ data: [] })

    render(<OrdersPage />)

    await waitFor(() => {
      expect(screen.getByTestId("empty-state")).toBeInTheDocument()
    })
  })

  it("should display orders when data is available", async () => {
    render(<OrdersPage />)

    await waitFor(() => {
      expect(screen.getByText("Buy USD 100")).toBeInTheDocument()
      expect(screen.getByText("ID: 1")).toBeInTheDocument()
    })
  })

  it("should navigate to order details when order is clicked", async () => {
    render(<OrdersPage />)

    await waitFor(() => {
      const orderRow = screen.getByText("Buy USD 100").closest("tr")
      fireEvent.click(orderRow!)
    })

    expect(mockRouter.push).toHaveBeenCalledWith("/orders/1")
  })

  it("should show mobile navigation when on mobile", () => {
    ;(useIsMobile as jest.Mock).mockReturnValue(true)

    render(<OrdersPage />)

    expect(screen.getByTestId("navigation")).toBeInTheDocument()
  })

  it("should handle tab value correctly from store", async () => {
    mockOrdersFilterStore.activeTab = "past"

    render(<OrdersPage />)

    await waitFor(() => {
      expect(OrdersAPI.getOrders).toHaveBeenCalledWith({ is_open: false })
    })
  })

  it("should maintain filter state across re-renders", async () => {
    const { rerender } = render(<OrdersPage />)

    // Simulate tab change
    fireEvent.click(screen.getByText("Past orders"))

    expect(mockOrdersFilterStore.setActiveTab).toHaveBeenCalledWith("past")

    // Re-render component
    rerender(<OrdersPage />)

    // Store should maintain the state
    expect(useOrdersFilterStore).toHaveBeenCalled()
  })
})
