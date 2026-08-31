import { render, screen, fireEvent } from "@testing-library/react"
import EmptyState from "@/components/empty-state"
import { useKycOverlay } from "@/hooks/use-kyc-overlay"
import jest from "jest"

const mockPush = jest.fn()
const mockRunGatedAction = jest.fn()

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}))

jest.mock("@/hooks/use-kyc-overlay", () => ({
  useKycOverlay: jest.fn(),
}))

jest.mock("@/lib/i18n/use-translations", () => ({
  useTranslations: () => ({
    t: (key: string) => key,
    locale: "en",
  }),
}))

jest.mock("@/analytics/useTrackers", () => ({
  useTrackers: () => ({ track: jest.fn() }),
}))

const mockUseKycOverlay = useKycOverlay as jest.MockedFunction<typeof useKycOverlay>

describe("EmptyState create ad", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockRunGatedAction.mockImplementation((onAllow: () => void) => onAllow())
    mockUseKycOverlay.mockReturnValue({
      runGatedAction: mockRunGatedAction,
      openKycIfUnverified: jest.fn(),
    })
  })

  const renderCreateAd = () =>
    render(
      <EmptyState
        title="No ads"
        description="Create one"
        redirectToAds
        route="markets"
        adType="buy"
      />,
    )

  it("gates Create ad through the shared KYC overlay", () => {
    renderCreateAd()
    fireEvent.click(screen.getByText("myAds.createAd"))

    expect(mockUseKycOverlay).toHaveBeenCalledWith({ route: "markets" })
    expect(mockRunGatedAction).toHaveBeenCalledTimes(1)
    expect(mockPush).toHaveBeenCalledWith("/ads/create?operation=sell")
  })

  it("does not navigate when the overlay blocks the action", () => {
    mockRunGatedAction.mockImplementation(() => undefined)
    renderCreateAd()
    fireEvent.click(screen.getByText("myAds.createAd"))

    expect(mockRunGatedAction).toHaveBeenCalledTimes(1)
    expect(mockPush).not.toHaveBeenCalled()
  })
})

describe("EmptyState generic action (shared list error state)", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseKycOverlay.mockReturnValue({
      runGatedAction: mockRunGatedAction,
      openKycIfUnverified: jest.fn(),
    })
  })

  it("renders the generic CTA and calls onAction without gating it behind KYC", () => {
    const onAction = jest.fn()
    render(
      <EmptyState
        title="errors.loadAdsFailedTitle"
        description="errors.loadFailedDescription"
        actionLabel="errors.retry"
        onAction={onAction}
      />,
    )

    fireEvent.click(screen.getByTestId("empty-state-btn-action"))

    expect(onAction).toHaveBeenCalledTimes(1)
    expect(mockRunGatedAction).not.toHaveBeenCalled()
    expect(mockPush).not.toHaveBeenCalled()
  })

  it("renders no generic CTA when only one half of the pair is supplied", () => {
    const { rerender } = render(<EmptyState title="No ads" actionLabel="errors.retry" />)
    expect(screen.queryByTestId("empty-state-btn-action")).toBeNull()

    rerender(<EmptyState title="No ads" onAction={jest.fn()} />)
    expect(screen.queryByTestId("empty-state-btn-action")).toBeNull()
  })
})
