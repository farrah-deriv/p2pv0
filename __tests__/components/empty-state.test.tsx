import { render, screen, fireEvent } from "@testing-library/react"
import EmptyState from "@/components/empty-state"
import { useUserDataStore } from "@/stores/user-data-store"
import { useGuideStore } from "@/stores/guide-store"
import { useAlertDialog } from "@/hooks/use-alert-dialog"
import jest from "jest"

const mockPush = jest.fn()
const mockOpenIntro = jest.fn()
const mockShowAlert = jest.fn()
const mockHideAlert = jest.fn()

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}))

jest.mock("@/stores/user-data-store", () => ({
  useUserDataStore: jest.fn(),
}))

jest.mock("@/stores/guide-store", () => ({
  useGuideStore: jest.fn(),
}))

jest.mock("@/hooks/use-alert-dialog", () => ({
  useAlertDialog: jest.fn(),
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

jest.mock("@/components/kyc-onboarding-sheet", () => ({
  createKycOnboardingAlertConfig: (opts: unknown) => ({ kind: "kyc", opts }),
}))

const mockUseUserDataStore = useUserDataStore as jest.MockedFunction<typeof useUserDataStore>
const mockUseGuideStore = useGuideStore as jest.MockedFunction<typeof useGuideStore>
const mockUseAlertDialog = useAlertDialog as jest.MockedFunction<typeof useAlertDialog>

const verifiedOnboarding = {
  kyc: { status: "verified", poi_status: "approved", poa_status: "approved" },
  verification: { email_verified: true, phone_verified: true },
  p2p: { allowed: true, criteria: [{ code: "phone_verified", passed: true }] },
}

const unverifiedOnboarding = {
  kyc: { status: "pending", poi_status: "none", poa_status: "none" },
  verification: { email_verified: true, phone_verified: false },
  p2p: { allowed: false, criteria: [{ code: "phone_verified", passed: false }] },
}

describe("EmptyState create ad", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseGuideStore.mockImplementation((selector?: (state: any) => unknown) => {
      const state = { openIntro: mockOpenIntro }
      return selector ? selector(state) : state
    })
    mockUseAlertDialog.mockReturnValue({
      showAlert: mockShowAlert,
      hideAlert: mockHideAlert,
      isOpen: false,
    } as any)
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

  it("opens only the guide intro when the user is verified but has no P2P profile yet", () => {
    mockUseUserDataStore.mockImplementation((selector?: (state: any) => unknown) => {
      const state = {
        userId: null,
        verificationStatus: null,
        onboardingStatus: verifiedOnboarding,
      }
      return selector ? selector(state) : state
    })

    renderCreateAd()
    fireEvent.click(screen.getByText("myAds.createAd"))

    expect(mockOpenIntro).toHaveBeenCalledTimes(1)
    expect(mockShowAlert).not.toHaveBeenCalled()
    expect(mockPush).not.toHaveBeenCalled()
  })

  it("opens only the KYC sheet when the user is not verified", () => {
    mockUseUserDataStore.mockImplementation((selector?: (state: any) => unknown) => {
      const state = {
        userId: null,
        verificationStatus: { phone_verified: false, kyc_verified: false, p2p_allowed: false },
        onboardingStatus: unverifiedOnboarding,
      }
      return selector ? selector(state) : state
    })

    renderCreateAd()
    fireEvent.click(screen.getByText("myAds.createAd"))

    expect(mockShowAlert).toHaveBeenCalledTimes(1)
    expect(mockOpenIntro).not.toHaveBeenCalled()
    expect(mockPush).not.toHaveBeenCalled()
  })

  it("navigates to create ad when the user is a verified P2P user", () => {
    mockUseUserDataStore.mockImplementation((selector?: (state: any) => unknown) => {
      const state = {
        userId: "user-1",
        verificationStatus: {
          email_verified: true,
          phone_verified: true,
          kyc_verified: true,
          p2p_allowed: true,
        },
        onboardingStatus: verifiedOnboarding,
      }
      return selector ? selector(state) : state
    })

    renderCreateAd()
    fireEvent.click(screen.getByText("myAds.createAd"))

    expect(mockPush).toHaveBeenCalledWith("/ads/create?operation=sell")
    expect(mockOpenIntro).not.toHaveBeenCalled()
    expect(mockShowAlert).not.toHaveBeenCalled()
  })
})
