import { renderHook, act, waitFor } from "@testing-library/react"
import { useKycOverlay } from "@/hooks/use-kyc-overlay"
import { useUserDataStore } from "@/stores/user-data-store"
import { useGuideStore } from "@/stores/guide-store"
import { useAlertDialog } from "@/hooks/use-alert-dialog"
import { useRefreshOnboardingStatus } from "@/hooks/use-refresh-onboarding-status"
import jest from "jest"

const mockOpenIntro = jest.fn()
const mockRequestOpenIntro = jest.fn()
const mockShowAlert = jest.fn()
const mockHideAlert = jest.fn()
const mockRefreshOnboardingStatus = jest.fn()

jest.mock("@/stores/user-data-store", () => ({
  useUserDataStore: jest.fn(),
}))

jest.mock("@/stores/guide-store", () => ({
  useGuideStore: jest.fn(),
}))

jest.mock("@/hooks/use-alert-dialog", () => ({
  useAlertDialog: jest.fn(),
}))

jest.mock("@/hooks/use-refresh-onboarding-status", () => ({
  useRefreshOnboardingStatus: jest.fn(),
}))

jest.mock("@/components/kyc-onboarding-sheet", () => ({
  createKycOnboardingAlertConfig: (opts: unknown) => ({ kind: "kyc", opts }),
}))

const mockUseUserDataStore = useUserDataStore as jest.MockedFunction<typeof useUserDataStore>
const mockUseGuideStore = useGuideStore as jest.MockedFunction<typeof useGuideStore>
const mockUseAlertDialog = useAlertDialog as jest.MockedFunction<typeof useAlertDialog>
const mockUseRefreshOnboardingStatus = useRefreshOnboardingStatus as jest.MockedFunction<
  typeof useRefreshOnboardingStatus
>

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

describe("useKycOverlay", () => {
  const originalKycMandatory = process.env.NEXT_PUBLIC_IS_KYC_MANDATORY

  beforeEach(() => {
    process.env.NEXT_PUBLIC_IS_KYC_MANDATORY = "1"
    jest.clearAllMocks()
    mockUseGuideStore.mockImplementation((selector?: (state: any) => unknown) => {
      const state = { openIntro: mockOpenIntro, requestOpenIntro: mockRequestOpenIntro }
      return selector ? selector(state) : state
    })
    mockUseAlertDialog.mockReturnValue({
      showAlert: mockShowAlert,
      hideAlert: mockHideAlert,
      isOpen: false,
    } as any)
    mockRefreshOnboardingStatus.mockResolvedValue({
      status: unverifiedOnboarding,
    })
    mockUseRefreshOnboardingStatus.mockReturnValue(mockRefreshOnboardingStatus)
    mockUseUserDataStore.getState = jest.fn(() => ({
      userId: null,
      verificationStatus: { phone_verified: false, kyc_verified: false, p2p_allowed: false },
      onboardingStatus: unverifiedOnboarding,
    }))
  })

  afterEach(() => {
    process.env.NEXT_PUBLIC_IS_KYC_MANDATORY = originalKycMandatory
  })

  const stubUser = (overrides: Record<string, unknown>) => {
    mockUseUserDataStore.mockImplementation((selector?: (state: any) => unknown) => {
      const state = {
        userId: null,
        verificationStatus: null,
        onboardingStatus: null,
        ...overrides,
      }
      return selector ? selector(state) : state
    })
  }

  it("runs the original action when the user is a verified P2P user", () => {
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
    const onAllow = jest.fn()
    const { result } = renderHook(() => useKycOverlay({ route: "markets" }))

    act(() => {
      result.current.runGatedAction(onAllow)
    })

    expect(onAllow).toHaveBeenCalledTimes(1)
    expect(mockOpenIntro).not.toHaveBeenCalled()
    expect(mockShowAlert).not.toHaveBeenCalled()
  })

  it("opens only the guide intro when the user is verified but has no P2P profile", () => {
    stubUser({ userId: null, onboardingStatus: verifiedOnboarding })
    const onAllow = jest.fn()
    const { result } = renderHook(() => useKycOverlay({ route: "markets" }))

    act(() => {
      result.current.runGatedAction(onAllow)
    })

    expect(mockOpenIntro).toHaveBeenCalledTimes(1)
    expect(onAllow).not.toHaveBeenCalled()
    expect(mockShowAlert).not.toHaveBeenCalled()
  })

  it("queues the intro when KYC is already open so Main can wait for it to close", () => {
    mockUseAlertDialog.mockReturnValue({
      showAlert: mockShowAlert,
      hideAlert: mockHideAlert,
      isOpen: true,
    } as any)
    stubUser({ userId: null, onboardingStatus: verifiedOnboarding })
    const { result } = renderHook(() => useKycOverlay({ route: "wallets" }))

    act(() => {
      result.current.runGatedAction(jest.fn())
    })

    expect(mockHideAlert).toHaveBeenCalledTimes(1)
    expect(mockRequestOpenIntro).toHaveBeenCalledTimes(1)
    expect(mockOpenIntro).not.toHaveBeenCalled()
    expect(mockShowAlert).not.toHaveBeenCalled()
  })

  it("opens only the KYC sheet when the user is not verified", async () => {
    stubUser({
      userId: null,
      verificationStatus: { phone_verified: false, kyc_verified: false, p2p_allowed: false },
      onboardingStatus: unverifiedOnboarding,
    })
    const onAllow = jest.fn()
    const { result } = renderHook(() => useKycOverlay({ route: "profile" }))

    act(() => {
      result.current.runGatedAction(onAllow)
    })

    await waitFor(() => {
      expect(mockShowAlert).toHaveBeenCalledTimes(1)
    })
    expect(mockRefreshOnboardingStatus).toHaveBeenCalledTimes(1)
    expect(mockOpenIntro).not.toHaveBeenCalled()
    expect(onAllow).not.toHaveBeenCalled()
  })

  it("runs the original action when a refresh finds the user just became a P2P user", async () => {
    stubUser({
      userId: null,
      verificationStatus: { phone_verified: false, kyc_verified: false, p2p_allowed: false },
      onboardingStatus: unverifiedOnboarding,
    })
    mockUseUserDataStore.getState = jest.fn(() => ({
      userId: "user-1",
      verificationStatus: {
        email_verified: true,
        phone_verified: true,
        kyc_verified: true,
        p2p_allowed: true,
      },
      onboardingStatus: verifiedOnboarding,
    }))
    mockRefreshOnboardingStatus.mockResolvedValue({
      status: verifiedOnboarding,
    })
    const onAllow = jest.fn()
    const { result } = renderHook(() => useKycOverlay({ route: "ads" }))

    act(() => {
      result.current.runGatedAction(onAllow)
    })

    await waitFor(() => {
      expect(onAllow).toHaveBeenCalledTimes(1)
    })
    expect(mockShowAlert).not.toHaveBeenCalled()
    expect(mockOpenIntro).not.toHaveBeenCalled()
  })

  it("does not auto-open KYC when status is already verified", async () => {
    stubUser({ userId: null, onboardingStatus: verifiedOnboarding })
    const { result } = renderHook(() => useKycOverlay({ route: "markets" }))

    await expect(result.current.openKycIfUnverified()).resolves.toBe("intro")
    expect(mockRefreshOnboardingStatus).not.toHaveBeenCalled()
    expect(mockShowAlert).not.toHaveBeenCalled()
  })

  it("refreshes before auto-opening KYC and skips when the user just became verified", async () => {
    stubUser({
      userId: null,
      verificationStatus: { phone_verified: false, kyc_verified: false, p2p_allowed: false },
      onboardingStatus: unverifiedOnboarding,
    })
    mockUseUserDataStore.getState = jest.fn(() => ({
      userId: "user-1",
      verificationStatus: {
        email_verified: true,
        phone_verified: true,
        kyc_verified: true,
        p2p_allowed: true,
      },
      onboardingStatus: verifiedOnboarding,
    }))
    mockRefreshOnboardingStatus.mockResolvedValue({
      status: verifiedOnboarding,
    })
    const { result } = renderHook(() => useKycOverlay({ route: "markets" }))

    act(() => {
      result.current.openKycIfUnverified()
    })

    await waitFor(() => {
      expect(mockRefreshOnboardingStatus).toHaveBeenCalledTimes(1)
    })
    expect(mockShowAlert).not.toHaveBeenCalled()
    expect(mockOpenIntro).not.toHaveBeenCalled()
  })

  it("opens KYC after refresh if the user is still unverified", async () => {
    stubUser({
      userId: null,
      verificationStatus: { phone_verified: false, kyc_verified: false, p2p_allowed: false },
      onboardingStatus: unverifiedOnboarding,
    })
    const { result } = renderHook(() => useKycOverlay({ route: "profile" }))

    act(() => {
      result.current.openKycIfUnverified()
    })

    await waitFor(() => {
      expect(mockShowAlert).toHaveBeenCalledTimes(1)
    })
    expect(mockOpenIntro).not.toHaveBeenCalled()
  })
})
