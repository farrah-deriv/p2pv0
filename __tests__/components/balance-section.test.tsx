import { render, screen, waitFor } from "@testing-library/react"
import { BalanceSection } from "@/components/balance-section/balance-section"
import { getTotalBalance } from "@/services/api/api-auth"
import jest from "jest"

jest.mock("@/services/api/api-auth")

const mockGetTotalBalance = getTotalBalance as jest.MockedFunction<typeof getTotalBalance>

describe("BalanceSection", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("should render loading state initially", () => {
    mockGetTotalBalance.mockImplementation(
      () => new Promise(() => {}), // Never resolves
    )

    render(<BalanceSection />)

    expect(screen.getByText("Est. total value")).toBeInTheDocument()
    expect(screen.getByRole("status", { hidden: true })).toBeInTheDocument()
  })

  it("should display balance after successful fetch", async () => {
    mockGetTotalBalance.mockResolvedValue({
      balance: 1234.56,
      currency: "USD",
    })

    render(<BalanceSection />)

    await waitFor(() => {
      expect(screen.getByText("1,234.56 USD")).toBeInTheDocument()
    })

    expect(screen.getByText("Est. total value")).toBeInTheDocument()
  })

  it("should format balance with two decimal places", async () => {
    mockGetTotalBalance.mockResolvedValue({
      balance: 100,
      currency: "USD",
    })

    render(<BalanceSection />)

    await waitFor(() => {
      expect(screen.getByText("100.00 USD")).toBeInTheDocument()
    })
  })

  it("should handle different currencies", async () => {
    mockGetTotalBalance.mockResolvedValue({
      balance: 5000,
      currency: "EUR",
    })

    render(<BalanceSection />)

    await waitFor(() => {
      expect(screen.getByText("5,000.00 EUR")).toBeInTheDocument()
    })
  })

  it("should handle fetch error gracefully", async () => {
    mockGetTotalBalance.mockRejectedValue(new Error("Network error"))

    const consoleSpy = jest.spyOn(console, "error").mockImplementation()

    render(<BalanceSection />)

    await waitFor(() => {
      expect(screen.getByText("0.00 USD")).toBeInTheDocument()
    })

    expect(consoleSpy).toHaveBeenCalledWith("Failed to fetch balance:", expect.any(Error))

    consoleSpy.mockRestore()
  })

  it("should apply custom className", () => {
    mockGetTotalBalance.mockResolvedValue({
      balance: 0,
      currency: "USD",
    })

    const { container } = render(<BalanceSection className="custom-class" />)

    expect(container.firstChild).toHaveClass("custom-class")
  })

  it("should format large numbers with commas", async () => {
    mockGetTotalBalance.mockResolvedValue({
      balance: 1234567.89,
      currency: "USD",
    })

    render(<BalanceSection />)

    await waitFor(() => {
      expect(screen.getByText("1,234,567.89 USD")).toBeInTheDocument()
    })
  })
})
