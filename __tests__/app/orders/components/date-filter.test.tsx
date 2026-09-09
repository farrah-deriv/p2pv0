import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { DateFilter } from "@/app/orders/components/date-filter"
import type { DateFilterType, DateRange } from "@/stores/orders-filter-store"
import jest from "jest" // Import jest to declare it

// Mock date-fns functions
jest.mock("date-fns", () => ({
  format: jest.fn((date, formatStr) => {
    if (formatStr === "MMM dd") return "Jan 01"
    if (formatStr === "MMM dd, yyyy") return "Jan 01, 2024"
    return "2024-01-01"
  }),
  subDays: jest.fn(() => new Date("2024-01-01")),
  subWeeks: jest.fn(() => new Date("2024-01-01")),
  subMonths: jest.fn(() => new Date("2024-01-01")),
  startOfDay: jest.fn((date) => date),
  endOfDay: jest.fn((date) => date),
}))

describe("DateFilter", () => {
  const mockOnValueChange = jest.fn()
  const mockOnCustomRangeChange = jest.fn()

  const defaultProps = {
    value: "all" as DateFilterType,
    customRange: { from: undefined, to: undefined } as DateRange,
    onValueChange: mockOnValueChange,
    onCustomRangeChange: mockOnCustomRangeChange,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders with default "All time" label', () => {
    render(<DateFilter {...defaultProps} />)

    expect(screen.getByText("All time")).toBeInTheDocument()
    expect(screen.getByRole("button")).toBeInTheDocument()
  })

  it("opens dropdown when clicked", async () => {
    render(<DateFilter {...defaultProps} />)

    fireEvent.click(screen.getByRole("button"))

    await waitFor(() => {
      expect(screen.getByText("Today")).toBeInTheDocument()
      expect(screen.getByText("Past 7 days")).toBeInTheDocument()
      expect(screen.getByText("Past 30 days")).toBeInTheDocument()
      expect(screen.getByText("Custom range")).toBeInTheDocument()
    })
  })

  it("calls onValueChange when selecting a preset option", async () => {
    render(<DateFilter {...defaultProps} />)

    fireEvent.click(screen.getByRole("button"))

    await waitFor(() => {
      fireEvent.click(screen.getByText("Today"))
    })

    expect(mockOnValueChange).toHaveBeenCalledWith("today")
  })

  it("shows calendar when custom range is selected", async () => {
    render(<DateFilter {...defaultProps} />)

    fireEvent.click(screen.getByRole("button"))

    await waitFor(() => {
      fireEvent.click(screen.getByText("Custom range"))
    })

    await waitFor(() => {
      expect(screen.getByText("Select date range")).toBeInTheDocument()
      expect(screen.getByText("Back")).toBeInTheDocument()
      expect(screen.getByText("Today")).toBeInTheDocument()
      expect(screen.getByText("Apply")).toBeInTheDocument()
    })
  })

  it("displays custom range label when custom dates are selected", () => {
    const customRange = {
      from: new Date("2024-01-01"),
      to: new Date("2024-01-31"),
    }

    render(<DateFilter {...defaultProps} value="custom" customRange={customRange} />)

    expect(screen.getByText("Jan 01 - Jan 01")).toBeInTheDocument()
  })

  it("handles Today button click in calendar view", async () => {
    render(<DateFilter {...defaultProps} />)

    fireEvent.click(screen.getByRole("button"))

    await waitFor(() => {
      fireEvent.click(screen.getByText("Custom range"))
    })

    await waitFor(() => {
      fireEvent.click(screen.getAllByText("Today")[1]) // Second "Today" button in calendar
    })

    expect(mockOnCustomRangeChange).toHaveBeenCalled()
    expect(mockOnValueChange).toHaveBeenCalledWith("custom")
  })

  it("applies custom range selection", async () => {
    render(<DateFilter {...defaultProps} />)

    fireEvent.click(screen.getByRole("button"))

    await waitFor(() => {
      fireEvent.click(screen.getByText("Custom range"))
    })

    await waitFor(() => {
      const applyButton = screen.getByText("Apply")
      expect(applyButton).toBeDisabled() // Should be disabled when no date selected
    })
  })

  it("cancels custom range selection", async () => {
    render(<DateFilter {...defaultProps} />)

    fireEvent.click(screen.getByRole("button"))

    await waitFor(() => {
      fireEvent.click(screen.getByText("Custom range"))
    })

    await waitFor(() => {
      fireEvent.click(screen.getByText("Cancel"))
    })

    // Should go back to dropdown view
    await waitFor(() => {
      expect(screen.getByText("All time")).toBeInTheDocument()
    })
  })
})
