import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import AdsPage from "@/app/ads/page"
import { useUserDataStore } from "@/stores/user-data-store"
import { useGuideStore } from "@/stores/guide-store"
import { useAdvertAlertDialog } from "@/app/ads/hooks/use-advert-alert-dialog"
import { useUserAdverts } from "@/hooks/use-api-queries"
import { useP2PSystemMaintenance } from "@/hooks/use-p2p-system-maintenance"
import jest from "jest"

const mockPush = jest.fn()
const mockOpenIntro = jest.fn()
const mockRequestOpenIntro = jest.fn()
const mockShowAlert = jest.fn()
const mockHideAlert = jest.fn()

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => ({ get: () => null }),
}))

jest.mock("next/image", () => ({
  __esModule: true,
  default: ({ alt }: { alt: string }) => <img alt={alt} />,
}))

jest.mock("@/stores/user-data-store", () => ({
  useUserDataStore: jest.fn(),
}))

jest.mock("@/stores/guide-store", () => ({
  useGuideStore: jest.fn(),
}))

jest.mock("@/app/ads/hooks/use-advert-alert-dialog", () => ({
  useAdvertAlertDialog: jest.fn(),
}))

jest.mock("@/hooks/use-api-queries", () => ({
  queryKeys: { ads: { allUserAdverts: () => ["user-adverts"] } },
  useUserAdverts: jest.fn(),
  useHideMyAds: () => ({ mutateAsync: jest.fn() }),
}))

jest.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({ invalidateQueries: jest.fn() }),
}))

jest.mock("@/hooks/use-mobile", () => ({
  useIsMobile: () => false,
}))

jest.mock("@/hooks/use-p2p-system-maintenance", () => ({
  useP2PSystemMaintenance: jest.fn(),
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

jest.mock("@/app/ads/components/my-ads-table", () => ({
  __esModule: true,
  default: () => <div data-testid="my-ads-table" />,
}))

jest.mock("@/components/temporary-ban-alert", () => ({
  TemporaryBanAlert: () => null,
}))

jest.mock("@/app/ads/components/ui/status-bottom-sheet", () => ({
  __esModule: true,
  default: () => null,
}))

const mockUseUserDataStore = useUserDataStore as jest.MockedFunction<typeof useUserDataStore>
const mockUseGuideStore = useGuideStore as jest.MockedFunction<typeof useGuideStore>
const mockUseAdvertAlertDialog = useAdvertAlertDialog as jest.MockedFunction<typeof useAdvertAlertDialog>
const mockUseUserAdverts = useUserAdverts as jest.MockedFunction<typeof useUserAdverts>
const mockUseP2PSystemMaintenance = useP2PSystemMaintenance as jest.MockedFunction<typeof useP2PSystemMaintenance>

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

describe("AdsPage create ad", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseGuideStore.mockImplementation((selector?: (state: any) => unknown) => {
      const state = { openIntro: mockOpenIntro, requestOpenIntro: mockRequestOpenIntro }
      return selector ? selector(state) : state
    })
    mockUseAdvertAlertDialog.mockReturnValue({
      showAlert: mockShowAlert,
      hideAlert: mockHideAlert,
      isOpen: false,
    } as any)
    mockUseP2PSystemMaintenance.mockReturnValue({ isActive: false } as any)
    // Create ad only renders when the active tab already has ads.
    mockUseUserAdverts.mockReturnValue({
      data: { pages: [[{ id: "ad-1" }]] },
      isLoading: false,
      isFetching: false,
      isFetchingNextPage: false,
      fetchNextPage: jest.fn(),
      hasNextPage: false,
      error: null,
      refetch: jest.fn(),
    } as any)
  })

  const stubUser = (overrides: Record<string, unknown>) => {
    mockUseUserDataStore.mockReturnValue({
      userData: {},
      userId: null,
      onboardingStatus: null,
      verificationStatus: null,
      ...overrides,
    } as any)
  }

  it("opens only the guide intro when the user is verified but has no P2P profile yet", () => {
    stubUser({ userId: null, onboardingStatus: verifiedOnboarding })

    render(<AdsPage />)
    fireEvent.click(screen.getByTestId("ads-btn-create"))

    expect(mockOpenIntro).toHaveBeenCalledTimes(1)
    expect(mockRequestOpenIntro).not.toHaveBeenCalled()
    expect(mockHideAlert).not.toHaveBeenCalled()
    expect(mockShowAlert).not.toHaveBeenCalled()
    expect(mockPush).not.toHaveBeenCalled()
  })

  it("queues the intro when KYC is already open so Main can wait for it to close", () => {
    mockUseAdvertAlertDialog.mockReturnValue({
      showAlert: mockShowAlert,
      hideAlert: mockHideAlert,
      isOpen: true,
    } as any)
    stubUser({ userId: null, onboardingStatus: verifiedOnboarding })

    render(<AdsPage />)
    fireEvent.click(screen.getByTestId("ads-btn-create"))

    expect(mockHideAlert).toHaveBeenCalledTimes(1)
    expect(mockRequestOpenIntro).toHaveBeenCalledTimes(1)
    expect(mockOpenIntro).not.toHaveBeenCalled()
    expect(mockShowAlert).not.toHaveBeenCalled()
    expect(mockPush).not.toHaveBeenCalled()
  })

  it("opens only the KYC sheet when the user is not verified", async () => {
    stubUser({
      userId: null,
      verificationStatus: { phone_verified: false, kyc_verified: false, p2p_allowed: false },
      onboardingStatus: unverifiedOnboarding,
    })

    render(<AdsPage />)
    fireEvent.click(screen.getByTestId("ads-btn-create"))

    await waitFor(() => {
      expect(mockShowAlert).toHaveBeenCalledTimes(1)
    })
    expect(mockOpenIntro).not.toHaveBeenCalled()
    expect(mockPush).not.toHaveBeenCalled()
  })

  it("navigates to create ad when the user is a verified P2P user", () => {
    stubUser({
      userId: "user-1",
      verificationStatus: {
        email_verified: true,
        phone_verified: true,
        kyc_verified: true,
        p2p_allowed: true,
      },
      onboardingStatus: verifiedOnboarding,
    })

    render(<AdsPage />)
    fireEvent.click(screen.getByTestId("ads-btn-create"))

    expect(mockPush).toHaveBeenCalledWith("/ads/create")
    expect(mockOpenIntro).not.toHaveBeenCalled()
    expect(mockShowAlert).not.toHaveBeenCalled()
  })
})
