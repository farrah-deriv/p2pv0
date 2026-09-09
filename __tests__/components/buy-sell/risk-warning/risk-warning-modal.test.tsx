import { render, screen, fireEvent } from "@testing-library/react"
import RiskWarningModal from "@/components/buy-sell/risk-warning/risk-warning-modal"
import { useIsMobile } from "@/lib/hooks/use-is-mobile"
import jest from "jest"

jest.mock("@/lib/hooks/use-is-mobile")

jest.mock("@/lib/i18n/use-translations", () => ({
  useTranslations: () => ({
    t: (key: string, params?: Record<string, string | number>) => {
      const map: Record<string, string> = {
        "market.riskWarning.lowCompletion.title": "This advertiser has a low completion rate",
        "market.riskWarning.lowCompletion.body": `They complete ${params?.rate}% of their trades. Check their profile before you continue.`,
        "market.riskWarning.highBlockCount.title": "Many traders have blocked this advertiser",
        "market.riskWarning.highBlockCount.body": `${params?.threshold} or more traders have chosen not to trade with them. Check their profile before you continue.`,
        "market.riskWarning.advertiserLabel": "Advertiser",
        "market.riskWarning.buyCompletionRateLabel": "Buy completion rate",
        "market.riskWarning.sellCompletionRateLabel": "Sell completion rate",
        "market.riskWarning.blockCountLabel": "Block count",
        "market.riskWarning.orderCompletedLabel": "Order completed",
        "market.riskWarning.continueAnyway": "Continue anyway",
        "market.riskWarning.goBack": "Go back",
      }
      return map[key] ?? key
    },
    locale: "en",
  }),
}))

const mockUseIsMobile = useIsMobile as jest.MockedFunction<typeof useIsMobile>

describe("RiskWarningModal", () => {
  const baseProps = {
    isOpen: true,
    advertiserNickname: "stagingOman1",
    onContinue: jest.fn(),
    onClose: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseIsMobile.mockReturnValue(false)
  })

  describe("low completion rate", () => {
    it("renders title, body with formatted rate, and field rows for buy advert", () => {
      render(
        <RiskWarningModal
          {...baseProps}
          result={{
            type: "low_completion_rate",
            isBuyAdvert: true,
            completionRate: 12,
            orderCount: 14,
          }}
        />,
      )

      expect(screen.getByText("This advertiser has a low completion rate")).toBeInTheDocument()
      expect(screen.getByText(/They complete 12.00% of their trades/)).toBeInTheDocument()
      expect(screen.getByText("stagingOman1")).toBeInTheDocument()
      expect(screen.getByText("Sell completion rate")).toBeInTheDocument()
      expect(screen.getByText("12.00%")).toBeInTheDocument()
      expect(screen.getByText("Order completed")).toBeInTheDocument()
      expect(screen.getByText("14")).toBeInTheDocument()
    })

    it("renders Buy completion rate label for sell advert", () => {
      render(
        <RiskWarningModal
          {...baseProps}
          result={{
            type: "low_completion_rate",
            isBuyAdvert: false,
            completionRate: 50,
            orderCount: 11,
          }}
        />,
      )

      expect(screen.getByText("Buy completion rate")).toBeInTheDocument()
      expect(screen.getByText("50.00%")).toBeInTheDocument()
    })

    it("preserves 2-decimal precision (no rounding) on weird rates", () => {
      render(
        <RiskWarningModal
          {...baseProps}
          result={{
            type: "low_completion_rate",
            isBuyAdvert: true,
            completionRate: 76.92,
            orderCount: 20,
          }}
        />,
      )

      expect(screen.getByText("76.92%")).toBeInTheDocument()
      expect(screen.getByText(/76.92% of their trades/)).toBeInTheDocument()
    })
  })

  describe("high block count", () => {
    it("renders block count title, body with threshold, and block count field", () => {
      render(
        <RiskWarningModal
          {...baseProps}
          result={{ type: "high_block_count", isBuyAdvert: true, blockCount: 34 }}
        />,
      )

      expect(screen.getByText("Many traders have blocked this advertiser")).toBeInTheDocument()
      expect(screen.getByText(/30 or more traders have chosen not to trade/)).toBeInTheDocument()
      expect(screen.getByText("Block count")).toBeInTheDocument()
      expect(screen.getByText("34")).toBeInTheDocument()
    })

    it("does not render completion rate fields for block count variant", () => {
      render(
        <RiskWarningModal
          {...baseProps}
          result={{ type: "high_block_count", isBuyAdvert: true, blockCount: 34 }}
        />,
      )

      expect(screen.queryByText("Sell completion rate")).not.toBeInTheDocument()
      expect(screen.queryByText("Buy completion rate")).not.toBeInTheDocument()
      expect(screen.queryByText("Order completed")).not.toBeInTheDocument()
    })
  })

  describe("button wiring", () => {
    it("fires onContinue when Continue anyway is clicked", () => {
      render(
        <RiskWarningModal
          {...baseProps}
          result={{ type: "high_block_count", isBuyAdvert: true, blockCount: 31 }}
        />,
      )

      fireEvent.click(screen.getByRole("button", { name: "Continue anyway" }))
      expect(baseProps.onContinue).toHaveBeenCalledTimes(1)
      expect(baseProps.onClose).not.toHaveBeenCalled()
    })

    it("fires onClose when Go back is clicked", () => {
      render(
        <RiskWarningModal
          {...baseProps}
          result={{ type: "high_block_count", isBuyAdvert: true, blockCount: 31 }}
        />,
      )

      fireEvent.click(screen.getByRole("button", { name: "Go back" }))
      expect(baseProps.onClose).toHaveBeenCalledTimes(1)
      expect(baseProps.onContinue).not.toHaveBeenCalled()
    })
  })

  describe("close X (desktop only)", () => {
    it("renders close X with accessible name on desktop", () => {
      mockUseIsMobile.mockReturnValue(false)
      render(
        <RiskWarningModal
          {...baseProps}
          result={{ type: "high_block_count", isBuyAdvert: true, blockCount: 31 }}
        />,
      )

      const closeButtons = screen.getAllByRole("button", { name: "Go back" })
      // Desktop renders BOTH the Go back button AND the close X (also labelled Go back).
      expect(closeButtons.length).toBe(2)
    })

    it("does NOT render close X on mobile", () => {
      mockUseIsMobile.mockReturnValue(true)
      render(
        <RiskWarningModal
          {...baseProps}
          result={{ type: "high_block_count", isBuyAdvert: true, blockCount: 31 }}
        />,
      )

      const closeButtons = screen.getAllByRole("button", { name: "Go back" })
      // Mobile drawer only has the bottom Go back button.
      expect(closeButtons.length).toBe(1)
    })
  })

  it("renders nothing when isOpen is false", () => {
    const { container } = render(
      <RiskWarningModal
        {...baseProps}
        isOpen={false}
        result={{ type: "high_block_count", isBuyAdvert: true, blockCount: 31 }}
      />,
    )
    expect(container).toBeEmptyDOMElement()
  })
})
