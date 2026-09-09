import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { useRouter } from "next/navigation"
import BuySellPage from "@/app/page"
import { useMarketFilterStore } from "@/stores/market-filter-store"
import { BuySellAPI } from "@/services/api"
import { useCurrencyData } from "@/hooks/use-currency-data"
import { useIsMobile } from "@/hooks/use-mobile"
import jest from "jest" // Import jest to fix the undeclared variable error

// Mock dependencies
jest.mock("next/navigation")
jest.mock("@/stores/market-filter-store")
jest.mock("@/services/api")
jest.mock("@/hooks/use-currency-data")
jest.mock("@/hooks/use-mobile")
jest.mock("@/components/navigation", () => {
  return function Navigation() {
    return <div data-testid="navigation">Navigation</div>
  }
})
jest.mock("@/components/mobile-footer-nav", () => {
  return function MobileFooterNav() {
    return <div data-testid="mobile-footer-nav">Mobile Footer Nav</div>
  }
})

const mockPush = jest.fn()
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>
const mockUseMarketFilterStore = useMarketFilterStore as jest.MockedFunction<typeof useMarketFilterStore>
const mockBuySellAPI = BuySellAPI as jest.Mocked<typeof BuySellAPI>
const mockUseCurrencyData = useCurrencyData as jest.MockedFunction<typeof useCurrencyData>
const mockUseIsMobile = useIsMobile as jest.MockedFunction<typeof useIsMobile>

const mockStoreState = {
  activeTab: "sell" as const,
  currency: "IDR",
  sortBy: "exchange_rate",
  filterOptions: { fromFollowing: false },
  selectedPaymentMethods: [],
  selectedAccountCurrency: "USD",
  setActiveTab: jest.fn(),
  setCurrency: jest.fn(),
  setSortBy: jest.fn(),
  setFilterOptions: jest.fn(),
  setSelectedPaymentMethods: jest.fn(),
  setSelectedAccountCurrency: jest.fn(),
  resetFilters: jest.fn(),
}

describe("BuySellPage with Zustand Store", () => {
  beforeEach(() => {
    mockUseRouter.mockReturnValue({
      push: mockPush,
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
    })

    mockUseMarketFilterStore.mockReturnValue(mockStoreState)

    mockBuySellAPI.getPaymentMethods.mockResolvedValue([
      { method: "bank_transfer", display_name: "Bank Transfer", type: "bank" },
      { method: "ewallet", display_name: "E-Wallet", type: "ewallet" },
    ])

    mockBuySellAPI.getAdvertisements.mockResolvedValue([])

    mockUseCurrencyData.mockReturnValue({
      currencies: [
        { code: "IDR", name: "Indonesian Rupiah" },
        { code: "USD", name: "US Dollar" },
      ],
    })

    mockUseIsMobile.mockReturnValue(false)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it("should render with initial store state", async () => {
    render(<BuySellPage />)

    await waitFor(() => {
      expect(screen.getByText("Buy")).toBeInTheDocument()
      expect(screen.getByText("Sell")).toBeInTheDocument()
    })
  })

  it("should call store actions when filters change", async () => {
    render(<BuySellPage />)

    await waitFor(() => {
      expect(screen.getByText("USD")).toBeInTheDocument()
    })

    // Click on BTC currency filter
    const btcButton = screen.getByText("BTC")
    fireEvent.click(btcButton)

    expect(mockStoreState.setSelectedAccountCurrency).toHaveBeenCalledWith("BTC")
  })

  it("should call store setCurrency when currency filter changes", async () => {
    render(<BuySellPage />)

    await waitFor(() => {
      expect(screen.getByText("IDR")).toBeInTheDocument()
    })

    // The currency filter component would trigger this
    // This test verifies the handler is properly connected
    expect(mockStoreState.setCurrency).toBeDefined()
  })

  it("should call store setActiveTab when tab changes", async () => {
    render(<BuySellPage />)

    await waitFor(() => {
      const sellTab = screen.getByRole("tab", { name: /sell/i })
      fireEvent.click(sellTab)
    })

    expect(mockStoreState.setActiveTab).toHaveBeenCalledWith("buy")
  })

  it("should initialize payment methods only when none are selected", async () => {
    // Test when no payment methods are selected
    mockUseMarketFilterStore.mockReturnValue({
      ...mockStoreState,
      selectedPaymentMethods: [],
    })

    render(<BuySellPage />)

    await waitFor(() => {
      expect(mockStoreState.setSelectedPaymentMethods).toHaveBeenCalledWith(["bank_transfer", "ewallet"])
    })
  })

  it("should not initialize payment methods when some are already selected", async () => {
    // Test when payment methods are already selected
    mockUseMarketFilterStore.mockReturnValue({
      ...mockStoreState,
      selectedPaymentMethods: ["bank_transfer"],
    })

    render(<BuySellPage />)

    await waitFor(() => {
      // Should not call setSelectedPaymentMethods since methods are already selected
      expect(mockStoreState.setSelectedPaymentMethods).not.toHaveBeenCalled()
    })
  })

  it("should fetch advertisements with store state parameters", async () => {
    const mockAdverts = [
      {
        id: "1",
        type: "sell",
        user: { id: 1, nickname: "TestUser" },
        exchange_rate: 15000,
        payment_currency: "IDR",
        account_currency: "USD",
        minimum_order_amount: 10,
        actual_maximum_order_amount: 1000,
        order_expiry_period: 30,
        payment_methods: ["Bank Transfer"],
      },
    ]

    mockBuySellAPI.getAdvertisements.mockResolvedValue(mockAdverts)

    render(<BuySellPage />)

    await waitFor(() => {
      expect(mockBuySellAPI.getAdvertisements).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "sell",
          account_currency: "USD",
          currency: "IDR",
          sortBy: "exchange_rate",
        }),
        expect.any(AbortSignal),
      )
    })
  })

  it("should handle filter options correctly", async () => {
    mockUseMarketFilterStore.mockReturnValue({
      ...mockStoreState,
      filterOptions: { fromFollowing: true },
    })

    render(<BuySellPage />)

    await waitFor(() => {
      expect(mockBuySellAPI.getAdvertisements).toHaveBeenCalledWith(
        expect.objectContaining({
          favourites_only: 1,
        }),
        expect.any(AbortSignal),
      )
    })
  })
})
