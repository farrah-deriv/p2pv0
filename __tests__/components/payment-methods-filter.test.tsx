import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import "@testing-library/jest-dom"
import PaymentMethodsFilter, { type PaymentMethod } from "@/components/payment-methods-filter/payment-methods-filter"
import jest from "jest" // Import jest to declare the variable

// Mock the hooks and components
jest.mock("@/hooks/use-mobile", () => ({
  useIsMobile: jest.fn(() => false),
}))

jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line jsx-a11y/alt-text, @next/next/no-img-element
    return <img {...props} />
  },
}))

const mockPaymentMethods: PaymentMethod[] = [
  { display_name: "Bank Transfer A", type: "bank", method: "bank_a" },
  { display_name: "Bank Transfer B", type: "bank", method: "bank_b" },
  { display_name: "E-Wallet A", type: "ewallet", method: "ewallet_a" },
  { display_name: "E-Wallet B", type: "ewallet", method: "ewallet_b" },
]

describe("PaymentMethodsFilter", () => {
  const mockOnSelectionChange = jest.fn()
  const defaultProps = {
    paymentMethods: mockPaymentMethods,
    selectedMethods: ["bank_a", "ewallet_a"],
    onSelectionChange: mockOnSelectionChange,
    trigger: <button>Open Filter</button>,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("renders the trigger button", () => {
    render(<PaymentMethodsFilter {...defaultProps} />)
    expect(screen.getByText("Open Filter")).toBeInTheDocument()
  })

  it("opens the filter when trigger is clicked", async () => {
    render(<PaymentMethodsFilter {...defaultProps} />)
    const trigger = screen.getByText("Open Filter")
    fireEvent.click(trigger)

    await waitFor(() => {
      expect(screen.getByPlaceholderText("Search")).toBeInTheDocument()
    })
  })

  it("displays payment method groups with checkboxes", async () => {
    render(<PaymentMethodsFilter {...defaultProps} />)
    fireEvent.click(screen.getByText("Open Filter"))

    await waitFor(() => {
      expect(screen.getByText("Bank Transfers")).toBeInTheDocument()
      expect(screen.getByText("E-Wallets")).toBeInTheDocument()
      expect(screen.getByLabelText("Bank Transfer A")).toBeInTheDocument()
      expect(screen.getByLabelText("Bank Transfer B")).toBeInTheDocument()
      expect(screen.getByLabelText("E-Wallet A")).toBeInTheDocument()
      expect(screen.getByLabelText("E-Wallet B")).toBeInTheDocument()
    })
  })

  it("toggles payment method selection when checkbox is clicked", async () => {
    render(<PaymentMethodsFilter {...defaultProps} />)
    fireEvent.click(screen.getByText("Open Filter"))

    await waitFor(() => {
      const checkbox = screen.getByLabelText("Bank Transfer B")
      expect(checkbox).toBeInTheDocument()
    })

    const checkbox = screen.getByLabelText("Bank Transfer B")
    fireEvent.click(checkbox)

    await waitFor(() => {
      expect(checkbox).toBeChecked()
    })
  })

  it("deselects only the clicked method when all methods are selected", async () => {
    const allSelected = mockPaymentMethods.map((m) => m.method)
    render(<PaymentMethodsFilter {...defaultProps} selectedMethods={allSelected} />)
    fireEvent.click(screen.getByText("Open Filter"))

    await waitFor(() => {
      expect(screen.getByLabelText("Bank Transfer A")).toBeChecked()
    })

    fireEvent.click(screen.getByLabelText("Bank Transfer A"))

    await waitFor(() => {
      expect(screen.getByLabelText("Bank Transfer A")).not.toBeChecked()
      expect(screen.getByLabelText("Bank Transfer B")).toBeChecked()
      expect(screen.getByLabelText("E-Wallet A")).toBeChecked()
      expect(screen.getByLabelText("E-Wallet B")).toBeChecked()
    })
  })

  it("filters payment methods based on search query", async () => {
    render(<PaymentMethodsFilter {...defaultProps} />)
    fireEvent.click(screen.getByText("Open Filter"))

    await waitFor(() => {
      expect(screen.getByPlaceholderText("Search")).toBeInTheDocument()
    })

    const searchInput = screen.getByPlaceholderText("Search")
    fireEvent.change(searchInput, { target: { value: "Bank" } })

    await waitFor(() => {
      expect(screen.getByText("Bank Transfer A")).toBeInTheDocument()
      expect(screen.getByText("Bank Transfer B")).toBeInTheDocument()
      expect(screen.queryByText("E-Wallet A")).not.toBeInTheDocument()
      expect(screen.queryByText("E-Wallet B")).not.toBeInTheDocument()
    })
  })

  it("selects all payment methods when 'Select all' is checked", async () => {
    render(<PaymentMethodsFilter {...defaultProps} />)
    fireEvent.click(screen.getByText("Open Filter"))

    await waitFor(() => {
      expect(screen.getByLabelText("Select all")).toBeInTheDocument()
    })

    const selectAllCheckbox = screen.getByLabelText("Select all")
    fireEvent.click(selectAllCheckbox)

    await waitFor(() => {
      expect(screen.getByLabelText("Bank Transfer A")).toBeChecked()
      expect(screen.getByLabelText("Bank Transfer B")).toBeChecked()
      expect(screen.getByLabelText("E-Wallet A")).toBeChecked()
      expect(screen.getByLabelText("E-Wallet B")).toBeChecked()
    })
  })

  it("deselects all payment methods when 'Select all' is unchecked", async () => {
    render(<PaymentMethodsFilter {...defaultProps} />)
    fireEvent.click(screen.getByText("Open Filter"))

    await waitFor(() => {
      expect(screen.getByLabelText("Select all")).toBeInTheDocument()
    })

    const selectAllCheckbox = screen.getByLabelText("Select all")
    fireEvent.click(selectAllCheckbox)
    fireEvent.click(selectAllCheckbox)

    await waitFor(() => {
      expect(screen.getByLabelText("Bank Transfer A")).not.toBeChecked()
      expect(screen.getByLabelText("Bank Transfer B")).not.toBeChecked()
      expect(screen.getByLabelText("E-Wallet A")).not.toBeChecked()
      expect(screen.getByLabelText("E-Wallet B")).not.toBeChecked()
    })
  })

  it("calls onSelectionChange with selected methods when Apply is clicked", async () => {
    render(<PaymentMethodsFilter {...defaultProps} />)
    fireEvent.click(screen.getByText("Open Filter"))

    await waitFor(() => {
      expect(screen.getByLabelText("Bank Transfer B")).toBeInTheDocument()
    })

    const checkbox = screen.getByLabelText("Bank Transfer B")
    fireEvent.click(checkbox)

    const applyButton = screen.getByText("Apply")
    fireEvent.click(applyButton)

    await waitFor(() => {
      expect(mockOnSelectionChange).toHaveBeenCalledWith(["bank_a", "ewallet_a", "bank_b"])
    })
  })

  it("resets selection to all methods when Reset is clicked", async () => {
    render(<PaymentMethodsFilter {...defaultProps} />)
    fireEvent.click(screen.getByText("Open Filter"))

    await waitFor(() => {
      expect(screen.getByText("Reset")).toBeInTheDocument()
    })

    const resetButton = screen.getByText("Reset")
    fireEvent.click(resetButton)

    await waitFor(() => {
      expect(mockOnSelectionChange).toHaveBeenCalledWith(["bank_a", "bank_b", "ewallet_a", "ewallet_b"])
    })
  })

  it("displays loading state when isLoading is true", async () => {
    render(<PaymentMethodsFilter {...defaultProps} isLoading={true} />)
    fireEvent.click(screen.getByText("Open Filter"))

    await waitFor(() => {
      expect(screen.getByText("Loading payment methods...")).toBeInTheDocument()
    })
  })

  it("displays empty state when no payment methods match search", async () => {
    render(<PaymentMethodsFilter {...defaultProps} />)
    fireEvent.click(screen.getByText("Open Filter"))

    await waitFor(() => {
      expect(screen.getByPlaceholderText("Search")).toBeInTheDocument()
    })

    const searchInput = screen.getByPlaceholderText("Search")
    fireEvent.change(searchInput, { target: { value: "NonExistent" } })

    await waitFor(() => {
      expect(screen.getByText("Payment method unavailable")).toBeInTheDocument()
    })
  })

  it("clears search when clear button is clicked", async () => {
    render(<PaymentMethodsFilter {...defaultProps} />)
    fireEvent.click(screen.getByText("Open Filter"))

    await waitFor(() => {
      expect(screen.getByPlaceholderText("Search")).toBeInTheDocument()
    })

    const searchInput = screen.getByPlaceholderText("Search")
    fireEvent.change(searchInput, { target: { value: "Bank" } })

    await waitFor(() => {
      expect(screen.getByAltText("Clear search")).toBeInTheDocument()
    })

    const clearButton = screen.getByAltText("Clear search")
    fireEvent.click(clearButton)

    await waitFor(() => {
      expect(searchInput).toHaveValue("")
    })
  })

  it("maintains checkbox state correctly for selected methods", async () => {
    render(<PaymentMethodsFilter {...defaultProps} />)
    fireEvent.click(screen.getByText("Open Filter"))

    await waitFor(() => {
      expect(screen.getByLabelText("Bank Transfer A")).toBeChecked()
      expect(screen.getByLabelText("E-Wallet A")).toBeChecked()
      expect(screen.getByLabelText("Bank Transfer B")).not.toBeChecked()
      expect(screen.getByLabelText("E-Wallet B")).not.toBeChecked()
    })
  })
})
