import { render, screen, fireEvent } from "@testing-library/react"
import AdsPage from "@/app/ads/page"
import { useUserDataStore } from "@/stores/user-data-store"
import { useAdvertAlertDialog } from "@/app/ads/hooks/use-advert-alert-dialog"
import { useUserAdverts } from "@/hooks/use-api-queries"
import { useP2PSystemMaintenance } from "@/hooks/use-p2p-system-maintenance"
import { useKycOverlay } from "@/hooks/use-kyc-overlay"
import jest from "jest"

const mockPush = jest.fn()
const mockShowAlert = jest.fn()
const mockHideAlert = jest.fn()
const mockRunGatedAction = jest.fn()
const mockOpenKycIfUnverified = jest.fn()

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

jest.mock("@/hooks/use-kyc-overlay", () => ({
  useKycOverlay: jest.fn(),
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
const mockUseAdvertAlertDialog = useAdvertAlertDialog as jest.MockedFunction<typeof useAdvertAlertDialog>
const mockUseUserAdverts = useUserAdverts as jest.MockedFunction<typeof useUserAdverts>
const mockUseP2PSystemMaintenance = useP2PSystemMaintenance as jest.MockedFunction<typeof useP2PSystemMaintenance>
const mockUseKycOverlay = useKycOverlay as jest.MockedFunction<typeof useKycOverlay>

describe("AdsPage create ad", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseAdvertAlertDialog.mockReturnValue({
      showAlert: mockShowAlert,
      hideAlert: mockHideAlert,
      isOpen: false,
    } as any)
    mockUseP2PSystemMaintenance.mockReturnValue({ isActive: false } as any)
    mockRunGatedAction.mockImplementation((onAllow: () => void) => onAllow())
    mockOpenKycIfUnverified.mockReturnValue("wait")
    mockUseKycOverlay.mockReturnValue({
      runGatedAction: mockRunGatedAction,
      openKycIfUnverified: mockOpenKycIfUnverified,
    })
    mockUseUserDataStore.mockReturnValue({
      userData: {},
      userId: "user-1",
    } as any)
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

  it("gates Create ad through the shared KYC overlay", () => {
    render(<AdsPage />)
    fireEvent.click(screen.getByTestId("ads-btn-create"))

    expect(mockRunGatedAction).toHaveBeenCalledTimes(1)
    expect(mockPush).toHaveBeenCalledWith("/ads/create")
  })

  it("does not navigate when the overlay blocks the action", () => {
    mockRunGatedAction.mockImplementation(() => undefined)
    render(<AdsPage />)
    fireEvent.click(screen.getByTestId("ads-btn-create"))

    expect(mockRunGatedAction).toHaveBeenCalledTimes(1)
    expect(mockPush).not.toHaveBeenCalled()
  })
})
