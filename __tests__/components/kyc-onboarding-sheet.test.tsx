import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { KycOnboardingSheet } from "@/components/kyc-onboarding-sheet/kyc-onboarding-sheet"
import { useUserDataStore } from "@/stores/user-data-store"
import { useGuideStore } from "@/stores/guide-store"
import * as AuthAPI from "@/services/api/api-auth"
import jest from "jest"

jest.mock("@/stores/user-data-store", () => ({
  useUserDataStore: jest.fn(),
}))

jest.mock("@/stores/guide-store", () => ({
  useGuideStore: jest.fn(),
}))

jest.mock("@/services/api/api-auth", () => ({
  __esModule: true,
  ...jest.requireActual("@/services/api/api-auth"),
  ensureP2PUser: jest.fn(),
  getOnboardingStatus: jest.fn(),
}))

// Stable mock instance so individual tests can configure fetchQuery's
// resolved value and the sheet sees the same client the test sets up.
const mockFetchQuery = jest.fn()
jest.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({ fetchQuery: mockFetchQuery }),
}))

jest.mock("@/hooks/use-api-queries", () => ({
  queryKeys: { auth: { onboardingStatus: () => ["auth", "onboardingStatus"] } },
}))

jest.mock("@/lib/i18n/use-translations", () => ({
  useTranslations: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        "kyc.setupProfile": "Profile details",
        "kyc.phoneNumber": "Phone number",
        "kyc.proofOfIdentity": "Proof of identity",
        "kyc.proofOfAddress": "Proof of address",
        "kyc.finishAccountSetup": "Finish account setup",
        "kyc.completeRemainingSteps":
          "Complete these steps to unlock full access to Deriv P2P.",
        "kyc.continueVerification": "Continue verification",
        "kyc.heroLogoAlt": "Deriv P2P",
        "kyc.heroHeadline": "One quick check and you're ready to trade",
        "kyc.heroBenefitPlaceOrder": "Place order",
        "kyc.heroBenefitPublishAds": "Publish ads",
        "kyc.heroBenefitHigherLimits": "Higher limits",
        "kyc.heroBenefitFasterWithdrawals": "Faster withdrawals",
        "kyc.verified": "Verified",
        "kyc.statusInReview": "In review",
        "kyc.failed": "Failed",
        "kyc.unverified": "Unverified",
        "kyc.gotIt": "Got it",
        "kyc.resubmitNow": "Resubmit now",
        "kyc.checkProofOfIdentity": "Check proof of identity",
        "kyc.checkProofOfAddress": "Check proof of address",
        "kyc.resubmitIdentityAndAddress":
          "Resubmit your proof of identity and address to continue using P2P.",
        "kyc.resubmitIdentity": "Resubmit your proof of identity to continue using P2P.",
        "kyc.resubmitAddress": "Resubmit your proof of address to continue using P2P.",
      }
      return map[key] ?? key
    },
    locale: "en",
  }),
}))

const mockUseUserDataStore = useUserDataStore as jest.MockedFunction<typeof useUserDataStore>
const mockUseGuideStore = useGuideStore as jest.MockedFunction<typeof useGuideStore>

const baseOnboardingStatus = {
  tnc: { accepted: true },
  profile: { status: "complete" },
  kyc: {
    status: "verified",
    poi_status: "approved",
    poa_status: "approved",
  },
  verification: {
    email_verified: true,
    phone_verified: true,
  },
  p2p: {
    allowed: true,
    criteria: [
      { code: "deposit_enabled", passed: true },
      { code: "withdraw_enabled", passed: true },
      { code: "phone_verified", passed: true },
    ],
  },
}

// Default guide-store mock: track requestOpenIntro / openIntro calls so the
// verified-during-KYC tests can assert the intro is queued, not mounted.
const guideStoreState = {
  requestOpenIntro: jest.fn(),
  openIntro: jest.fn(),
  dismissIntro: jest.fn(),
  isIntroOpen: false,
  pendingOpenIntro: false,
}

describe("KycOnboardingSheet", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    delete (window as any).location
    window.location = { href: "" } as any

    mockUseUserDataStore.mockImplementation((selector?: (state: any) => unknown) => {
      const state = {
        onboardingStatus: baseOnboardingStatus,
        userId: "user-1",
        userData: { signup: "v2" },
        isWalletAccount: false,
      }
      return selector ? selector(state) : state
    })

    mockUseGuideStore.mockImplementation((selector?: (state: any) => unknown) => {
      const state = {
        ...guideStoreState,
        requestOpenIntro: jest.fn(),
        openIntro: jest.fn(),
      }
      return selector ? selector(state) : state
    })
  })

  it("renders revamped title, body, hero benefits, and default CTA", () => {
    render(<KycOnboardingSheet />)

    expect(screen.getByText("Finish account setup")).toBeInTheDocument()
    expect(
      screen.getByText("Complete these steps to unlock full access to Deriv P2P."),
    ).toBeInTheDocument()
    expect(screen.getByText("One quick check and you're ready to trade")).toBeInTheDocument()
    expect(screen.getByText("Place order")).toBeInTheDocument()
    expect(screen.getByText("Publish ads")).toBeInTheDocument()
    expect(screen.getByText("Higher limits")).toBeInTheDocument()
    expect(screen.getByText("Faster withdrawals")).toBeInTheDocument()
    expect(screen.getByText("Got it")).toBeInTheDocument()
  })

  it("uses desktop and mobile onboarding screen assets", () => {
    const { container } = render(<KycOnboardingSheet />)

    expect(
      container.querySelector('img[src="/images/onboarding/desktop_screen.svg"]'),
    ).toBeInTheDocument()
    expect(
      container.querySelector('img[src="/images/onboarding/mobile_screen.svg"]'),
    ).toBeInTheDocument()
  })

  it("shows profile completion tick for completed profile step", () => {
    const { container } = render(<KycOnboardingSheet />)

    const ticks = container.querySelectorAll('img[src="/icons/tick.svg"]')
    expect(ticks.length).toBeGreaterThan(0)
  })

  it("shows Verified badge for phone step when phone_verified criteria passed", () => {
    mockUseUserDataStore.mockImplementation((selector?: (state: any) => unknown) => {
      const state = {
        onboardingStatus: {
          ...baseOnboardingStatus,
          kyc: {
            status: "pending",
            poi_status: "pending",
            poa_status: "pending",
          },
        },
        userId: "user-1",
        userData: { signup: "v2" },
        isWalletAccount: false,
      }
      return selector ? selector(state) : state
    })

    render(<KycOnboardingSheet />)

    expect(screen.getByText("Verified")).toBeInTheDocument()
  })

  it("does not show Verified badge for phone step when phone not verified", () => {
    mockUseUserDataStore.mockImplementation((selector?: (state: any) => unknown) => {
      const state = {
        onboardingStatus: {
          ...baseOnboardingStatus,
          kyc: {
            status: "pending",
            poi_status: "pending",
            poa_status: "pending",
          },
          p2p: {
            allowed: true,
            criteria: [{ code: "phone_verified", passed: false }],
          },
        },
        userId: "user-1",
        userData: { signup: "v2" },
        isWalletAccount: false,
      }
      return selector ? selector(state) : state
    })

    render(<KycOnboardingSheet />)

    expect(screen.queryByText("Verified")).not.toBeInTheDocument()
  })

  it("navigates to the first incomplete step when Continue verification is clicked", () => {
    mockUseUserDataStore.mockImplementation((selector?: (state: any) => unknown) => {
      const state = {
        onboardingStatus: {
          ...baseOnboardingStatus,
          profile: { status: "incomplete" },
          tnc: { accepted: false },
          kyc: {
            status: "pending",
            poi_status: "pending",
            poa_status: "pending",
          },
          p2p: {
            allowed: false,
            criteria: [{ code: "phone_verified", passed: false }],
          },
        },
        userId: "user-1",
        userData: { signup: "v2" },
        isWalletAccount: false,
      }
      return selector ? selector(state) : state
    })

    render(<KycOnboardingSheet />)

    fireEvent.click(screen.getByText("Continue verification"))

    expect(window.location.href).toContain("dashboard/onboarding/personal-details")
  })

  it("shows Resubmit now for incomplete POI/POA state", () => {
    mockUseUserDataStore.mockImplementation((selector?: (state: any) => unknown) => {
      const state = {
        onboardingStatus: {
          ...baseOnboardingStatus,
          kyc: {
            status: "pending",
            poi_status: "pending",
            poa_status: "pending",
          },
        },
        userId: "user-1",
        userData: { signup: "v2" },
        isWalletAccount: false,
      }
      return selector ? selector(state) : state
    })

    render(<KycOnboardingSheet />)

    expect(screen.getByText("Resubmit now")).toBeInTheDocument()
  })

  it("does not show Resubmit now when userId is null", () => {
    mockUseUserDataStore.mockImplementation((selector?: (state: any) => unknown) => {
      const state = {
        onboardingStatus: {
          ...baseOnboardingStatus,
          kyc: {
            status: "pending",
            poi_status: "pending",
            poa_status: "pending",
          },
        },
        userId: null,
        userData: { signup: "v2" },
        isWalletAccount: false,
      }
      return selector ? selector(state) : state
    })

    render(<KycOnboardingSheet />)

    expect(screen.queryByText("Resubmit now")).not.toBeInTheDocument()
  })

  it("shows check proof of identity CTA when POI is rejected and POA is complete", () => {
    mockUseUserDataStore.mockImplementation((selector?: (state: any) => unknown) => {
      const state = {
        onboardingStatus: {
          ...baseOnboardingStatus,
          kyc: {
            status: "pending",
            poi_status: "rejected",
            poa_status: "approved",
          },
        },
        userId: "user-1",
        userData: { signup: "v2" },
        isWalletAccount: false,
      }
      return selector ? selector(state) : state
    })

    render(<KycOnboardingSheet />)

    expect(screen.getByText("Check proof of identity")).toBeInTheDocument()
  })

  it("does not render when onboarding status is null", () => {
    mockUseUserDataStore.mockImplementation((selector?: (state: any) => unknown) => {
      const state = {
        onboardingStatus: null,
        userId: "user-1",
        userData: { signup: "v2" },
        isWalletAccount: false,
      }
      return selector ? selector(state) : state
    })

    const { container } = render(<KycOnboardingSheet />)

    expect(container.firstChild).toBeNull()
  })
})

describe("KycOnboardingSheet — verified during KYC popup", () => {
  // The regression this guards: when the KYC sheet detects verification has
  // completed, it must queue the intro (requestOpenIntro) rather than calling
  // openIntro() on the same tick as onClose(). Mounting the intro's Radix
  // portal on top of the KYC overlay mid-teardown strands a backdrop and
  // leaves the intro CTAs unclickable.
  const requestOpenIntro = jest.fn()
  const openIntro = jest.fn()
  const setIsOnboardingStatusRefreshing = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    delete (window as any).location
    window.location = { href: "" } as any

    // The sheet selects requestOpenIntro via useGuideStore(s => s.requestOpenIntro).
    // Capture the action so we can assert it was called (and openIntro was not).
    mockUseGuideStore.mockImplementation((selector?: (state: any) => unknown) => {
      const state = {
        requestOpenIntro,
        openIntro,
        dismissIntro: jest.fn(),
        isIntroOpen: false,
        pendingOpenIntro: false,
      }
      return selector ? selector(state) : state
    })

    // After ensureP2PUser resolves, the sheet re-reads userId from the store
    // via getState(). Return the newly-created id so the sheet proceeds to
    // onClose + requestOpenIntro.
    ;(useUserDataStore as any).getState = jest.fn(() => ({ userId: "new-p2p-user" }))

    mockUseUserDataStore.mockImplementation((selector?: (state: any) => unknown) => {
      const state = {
        onboardingStatus: baseOnboardingStatus,
        // null userId is what triggers the refresh branch.
        userId: null,
        userData: { signup: "v2" },
        isWalletAccount: false,
        setIsOnboardingStatusRefreshing,
      }
      return selector ? selector(state) : state
    })

    // The refresh branch fetches onboarding status; return allowed=true so
    // the sheet creates the P2P user and queues the intro.
    mockFetchQuery.mockResolvedValue({
      ...baseOnboardingStatus,
      p2p: { ...baseOnboardingStatus.p2p, allowed: true },
    })
    ;(AuthAPI.ensureP2PUser as jest.Mock).mockResolvedValue(undefined)
    ;(AuthAPI.getOnboardingStatus as jest.Mock).mockResolvedValue({
      ...baseOnboardingStatus,
      p2p: { ...baseOnboardingStatus.p2p, allowed: true },
    })
  })

  it("queues the intro via requestOpenIntro (not openIntro) and calls onClose when verification completes", async () => {
    const onClose = jest.fn()
    render(<KycOnboardingSheet route="markets" onClose={onClose} />)

    await waitFor(() => {
      expect(AuthAPI.ensureP2PUser).toHaveBeenCalled()
    })

    await waitFor(() => {
      // Dismisses the KYC popup (begins Radix teardown)…
      expect(onClose).toHaveBeenCalledTimes(1)
      // …and queues the intro without mounting it. openIntro must NOT fire
      // synchronously — Main opens it once the alert dialog has closed.
      expect(requestOpenIntro).toHaveBeenCalledTimes(1)
      expect(openIntro).not.toHaveBeenCalled()
    })
  })
})
