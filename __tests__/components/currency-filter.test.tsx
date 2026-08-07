import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { CurrencyFilter } from "@/components/currency-filter/currency-filter"
import type { Currency } from "@/components/currency-filter/types"
import jest from "jest" // Import jest to declare the variable

jest.mock("@/components/ui/use-mobile", () => ({
  useIsMobile: jest.fn(() => false),
}))

const mockCurrencies: Currency[] = [
  { code: "IDR", name: "Indonesian rupiah" },
  { code: "ARS", name: "Argentine peso" },
  { code: "BDT", name: "Bangladeshi taka" },
  { code: "BOB", name: "Boliviano" },
  { code: "BRL", name: "Brazilian real" },
  { code: "USD", name: "US Dollar" },
  { code: "EUR", name: "Euro" },
]

const mockOnCurrencySelect = jest.fn()

const defaultProps = {
  currencies: mockCurrencies,
  selectedCurrency: "IDR",
  onCurrencySelect: mockOnCurrencySelect,
}

describe("CurrencyFilter", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("renders trigger button with selected currency", () => {
    render(<CurrencyFilter {...defaultProps} />)
    expect(screen.getByTestId("currency-filter-btn-trigger")).toBeInTheDocument()
    expect(screen.getByText("IDR")).toBeInTheDocument()
  })

  it("opens dropdown on trigger click", async () => {
    render(<CurrencyFilter {...defaultProps} />)

    const trigger = screen.getByTestId("currency-filter-btn-trigger")
    await userEvent.click(trigger)

    expect(screen.getByPlaceholderText("Search")).toBeInTheDocument()
    expect(screen.getByText("IDR - Indonesian rupiah")).toBeInTheDocument()
  })

  it("filters currencies continuously as user types", async () => {
    render(<CurrencyFilter {...defaultProps} />)

    const trigger = screen.getByTestId("currency-filter-btn-trigger")
    await userEvent.click(trigger)

    const searchInput = screen.getByPlaceholderText("Search")

    // Type 'indo' - should show Indonesian rupiah
    await userEvent.type(searchInput, "indo")

    expect(screen.getByText("IDR - Indonesian rupiah")).toBeInTheDocument()
    expect(screen.queryByText("ARS - Argentine peso")).not.toBeInTheDocument()

    // Clear and type 'arg' - should show Argentine peso
    await userEvent.clear(searchInput)
    await userEvent.type(searchInput, "arg")

    expect(screen.getByText("ARS - Argentine peso")).toBeInTheDocument()
    expect(screen.queryByText("IDR - Indonesian rupiah")).not.toBeInTheDocument()
  })

  it("filters by currency code continuously", async () => {
    render(<CurrencyFilter {...defaultProps} />)

    const trigger = screen.getByTestId("currency-filter-btn-trigger")
    await userEvent.click(trigger)

    const searchInput = screen.getByPlaceholderText("Search")

    // Type 'USD' - should show US Dollar
    await userEvent.type(searchInput, "USD")

    expect(screen.getByText("USD - US Dollar")).toBeInTheDocument()
    expect(screen.queryByText("EUR - Euro")).not.toBeInTheDocument()
  })

  it("filters by partial word matches", async () => {
    render(<CurrencyFilter {...defaultProps} />)

    const trigger = screen.getByTestId("currency-filter-btn-trigger")
    await userEvent.click(trigger)

    const searchInput = screen.getByPlaceholderText("Search")

    // Type 'real' - should show Brazilian real
    await userEvent.type(searchInput, "real")

    expect(screen.getByText("BRL - Brazilian real")).toBeInTheDocument()
    expect(screen.queryByText("USD - US Dollar")).not.toBeInTheDocument()
  })

  it("shows empty message when no currencies match search", async () => {
    render(<CurrencyFilter {...defaultProps} />)

    const trigger = screen.getByTestId("currency-filter-btn-trigger")
    await userEvent.click(trigger)

    const searchInput = screen.getByPlaceholderText("Search")

    // Type something that won't match any currency
    await userEvent.type(searchInput, "xyz")

    expect(screen.getByText("Currency is unavailable")).toBeInTheDocument()
  })

  it("clears search when closing dropdown", async () => {
    render(<CurrencyFilter {...defaultProps} />)

    const trigger = screen.getByTestId("currency-filter-btn-trigger")
    await userEvent.click(trigger)

    const searchInput = screen.getByPlaceholderText("Search")
    await userEvent.type(searchInput, "test")

    // Close dropdown by pressing Escape
    fireEvent.keyDown(searchInput, { key: "Escape" })

    // Reopen and check that search is cleared
    await userEvent.click(trigger)
    const newSearchInput = screen.getByPlaceholderText("Search")
    expect(newSearchInput).toHaveValue("")
  })

  it("selects currency and closes dropdown", async () => {
    render(<CurrencyFilter {...defaultProps} />)

    const trigger = screen.getByTestId("currency-filter-btn-trigger")
    await userEvent.click(trigger)

    const currencyOption = screen.getByText("USD - US Dollar")
    await userEvent.click(currencyOption)

    expect(mockOnCurrencySelect).toHaveBeenCalledWith("USD")

    // Check that dropdown is closed
    await waitFor(() => {
      expect(screen.queryByPlaceholderText("Search")).not.toBeInTheDocument()
    })
  })

  it("highlights selected currency", async () => {
    render(<CurrencyFilter {...defaultProps} selectedCurrency="USD" />)

    const trigger = screen.getByTestId("currency-filter-btn-trigger")
    await userEvent.click(trigger)

    const selectedCurrencyItem = screen.getByTestId("currency-filter-btn-USD")
    expect(selectedCurrencyItem).toHaveClass("bg-neutral-50", "font-medium", "text-neutral-800")
  })

  it("handles keyboard Escape to close", async () => {
    render(<CurrencyFilter {...defaultProps} />)

    const trigger = screen.getByTestId("currency-filter-btn-trigger")
    await userEvent.click(trigger)

    const searchInput = screen.getByPlaceholderText("Search")

    // Press Escape to close
    fireEvent.keyDown(searchInput, { key: "Escape" })

    await waitFor(() => {
      expect(screen.queryByPlaceholderText("Search")).not.toBeInTheDocument()
    })
  })

  it("auto-focuses search input when opened", async () => {
    render(<CurrencyFilter {...defaultProps} />)

    const trigger = screen.getByTestId("currency-filter-btn-trigger")
    await userEvent.click(trigger)

    const searchInput = screen.getByPlaceholderText("Search")
    expect(searchInput).toHaveFocus()
  })

  it("handles case-insensitive search", async () => {
    render(<CurrencyFilter {...defaultProps} />)

    const trigger = screen.getByTestId("currency-filter-btn-trigger")
    await userEvent.click(trigger)

    const searchInput = screen.getByPlaceholderText("Search")

    // Type in different cases
    await userEvent.type(searchInput, "DOLLAR")
    expect(screen.getByText("USD - US Dollar")).toBeInTheDocument()

    await userEvent.clear(searchInput)
    await userEvent.type(searchInput, "dollar")
    expect(screen.getByText("USD - US Dollar")).toBeInTheDocument()

    await userEvent.clear(searchInput)
    await userEvent.type(searchInput, "Dollar")
    expect(screen.getByText("USD - US Dollar")).toBeInTheDocument()
  })
})
