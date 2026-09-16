import { render, screen } from "@testing-library/react"
import { BalanceSection } from "@/components/balance-section/balance-section"

// `BalanceSection` is a pure, prop-driven presentational component: it renders
// whatever `balance`/`currency`/`isLoading` it is handed and never fetches. The
// P2P balance now comes from `total_account_value` (users/me) on both the Market
// and Wallet screens, so there is no API call for this component to exercise.
jest.mock("@/lib/i18n/use-translations", () => ({
  useTranslations: () => ({
    t: (key: string) => (key === "wallet.estTotalValue" ? "Est. total value" : key),
    locale: "en",
  }),
}))

describe("BalanceSection", () => {
  it("renders the skeleton while loading", () => {
    render(<BalanceSection balance="0.00" currency="USD" isLoading />)

    expect(screen.getByText("Est. total value")).toBeInTheDocument()
    // Amount is hidden behind the loading skeleton.
    expect(screen.queryByText(/USD/)).not.toBeInTheDocument()
  })

  it("displays the balance and currency it is given", () => {
    render(<BalanceSection balance="1234.56" currency="USD" isLoading={false} />)

    expect(screen.getByText("Est. total value")).toBeInTheDocument()
    expect(screen.getByText("1,234.56 USD")).toBeInTheDocument()
  })

  it("formats whole amounts with two decimal places", () => {
    render(<BalanceSection balance="100" currency="USD" isLoading={false} />)

    expect(screen.getByText("100.00 USD")).toBeInTheDocument()
  })

  it("handles non-USD currencies", () => {
    render(<BalanceSection balance="5000" currency="EUR" isLoading={false} />)

    expect(screen.getByText("5,000.00 EUR")).toBeInTheDocument()
  })

  it("formats large numbers with grouping separators", () => {
    render(<BalanceSection balance="1234567.89" currency="USD" isLoading={false} />)

    expect(screen.getByText("1,234,567.89 USD")).toBeInTheDocument()
  })

  it("falls back to 0.00 for a missing or non-numeric balance", () => {
    render(<BalanceSection balance="" currency="USD" isLoading={false} />)

    expect(screen.getByText("0.00 USD")).toBeInTheDocument()
  })

  it("falls back to USD when no currency is provided", () => {
    render(<BalanceSection balance="10" currency="" isLoading={false} />)

    expect(screen.getByText("10.00 USD")).toBeInTheDocument()
  })

  it("applies a custom className to the root element", () => {
    const { container } = render(
      <BalanceSection balance="0" currency="USD" isLoading={false} className="custom-class" />,
    )

    expect(container.firstChild).toHaveClass("custom-class")
  })
})
