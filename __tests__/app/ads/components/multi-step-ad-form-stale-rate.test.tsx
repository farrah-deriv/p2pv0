import React from "react"
import { act, render, screen, waitFor } from "@testing-library/react"
import MultiStepAdForm from "@/app/ads/components/shared/multi-step-ad-form"
import { AdsAPI } from "@/services/api"
import { useAdvertAlertDialog } from "@/app/ads/hooks/use-advert-alert-dialog"
import jest from "jest"

const mockShowAlert = jest.fn()

const mockExchangeRate = {
  pairKey: "USD:AFN",
  rate: null as number | null,
  cachedRate: null as number | null,
  status: null as string | null,
  isLoading: false,
  // "the feed has spoken about this pair" — distinct from isLoading, which also
  // goes false when the settle timer expires without any update arriving.
  hasResolvedStatus: false,
  hasSettled: false,
  isExplicitlyUnavailable: false,
  getCachedRate: (key: string) =>
    key === "USD:AFN" ? mockExchangeRate.cachedRate : null,
}

// Every commit of AdDetailsForm, so a test can assert on what was painted at any
// point rather than only on the settled result. Both the late-float flash and the
// empty-then-filled flash this suite guards against are invisible to a waitFor on
// the final state.
const renderLog: Array<{ priceType: string; fixedRate: string; rateResolving: boolean }> = []

// Create mode has no prefill, so the draft's rate type only reaches the wizard
// through AdDetailsForm's onFormDataChange. This stands in for the user's choice.
const mockCreateDraft = { priceType: "float" as "fixed" | "float", floatingRate: 3 as number | "" }

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
  useSearchParams: () => ({ get: () => null }),
}))

jest.mock("next/image", () => ({
  __esModule: true,
  // eslint-disable-next-line @next/next/no-img-element
  default: ({ alt }: { alt: string }) => <img alt={alt} />,
}))

// Every mocked hook below must return a stable reference: several wizard effects
// list these values in their dependency arrays, so a fresh object per render would
// re-fire them forever rather than exercise the behaviour under test.
jest.mock("@/lib/i18n/use-translations", () => {
  const translations = { t: (key: string) => key, locale: "en" }
  return { useTranslations: () => translations }
})

jest.mock("@/app/ads/hooks/use-advert-alert-dialog", () => ({
  useAdvertAlertDialog: jest.fn(),
}))

jest.mock("@/app/ads/hooks/use-wizard-exchange-rate", () => ({
  useWizardExchangeRate: () => mockExchangeRate,
}))

jest.mock("@/services/api", () => ({
  AdsAPI: { getAdvert: jest.fn() },
}))

jest.mock("@/hooks/use-api-queries", () => {
  const empty: unknown[] = []
  const mutation = { mutateAsync: () => Promise.resolve({}) }
  const settings = {
    data: {
      float_rate_enabled: true,
      countries: [{ code: "af", currency: "AFN", currency_name: "Afghan afghani" }],
    },
    isLoading: false,
  }
  const userPaymentMethods = { data: undefined, refetch: () => Promise.resolve() }
  const paymentMethods = { data: empty }
  return {
    flattenUserPaymentMethodsPages: () => empty,
    useCreateAd: () => mutation,
    useUpdateAd: () => mutation,
    useSettings: () => settings,
    useUserPaymentMethods: () => userPaymentMethods,
    usePaymentMethods: () => paymentMethods,
  }
})

jest.mock("@/hooks/use-account-currencies", () => {
  const result = {
    accountCurrencies: [
      { code: "AFN", name: "Afghan afghani", decimal: { minimum: 2, maximum: 2 } },
    ],
    isLoading: false,
    error: null,
  }
  return { useAccountCurrencies: () => result }
})

jest.mock("@/stores/user-data-store", () => {
  const state = { localCurrency: "AFN", userData: { trade_band: "bronze" } }
  return {
    useUserDataStore: (selector?: (s: Record<string, unknown>) => unknown) =>
      selector ? selector(state) : state,
  }
})

jest.mock("@/stores/guide-store", () => {
  const state = {
    currentStep: 0,
    guideType: null,
    isGuideActive: false,
    startGuide: () => undefined,
    setAdTradeType: () => undefined,
  }
  return {
    useGuideStore: (selector?: (s: Record<string, unknown>) => unknown) =>
      selector ? selector(state) : state,
  }
})

jest.mock("@/hooks/use-toast", () => {
  const result = { toast: () => undefined }
  return { useToast: () => result }
})
jest.mock("@/hooks/use-mobile", () => ({ useIsMobile: () => false }))
jest.mock("@/analytics/useTrackers", () => {
  const result = { track: () => undefined }
  return { useTrackers: () => result }
})

jest.mock("@/components/navigation", () => ({ __esModule: true, default: () => null }))
jest.mock("@/app/ads/components/shared/progress-steps", () => ({ ProgressSteps: () => null }))
jest.mock("@/app/ads/components/ui/ad-details-form-skeleton", () => ({
  AdDetailsFormSkeleton: () => <div data-testid="ad-details-skeleton" />,
}))
jest.mock("@/app/ads/components/payment-details-form", () => ({ __esModule: true, default: () => null }))
jest.mock("@/app/ads/components/share-ad-page", () => ({ __esModule: true, default: () => null }))
jest.mock("@/app/ads/components/ad-success-screen", () => ({ __esModule: true, default: () => null }))
jest.mock("@/app/ads/components/shared/order-time-limit-selector", () => ({ __esModule: true, default: () => null }))
jest.mock("@/app/ads/components/shared/ad-condition-chip-selector", () => ({ __esModule: true, default: () => null }))
jest.mock("@/app/ads/components/shared/minimum-tier-selector", () => ({ __esModule: true, default: () => null }))
jest.mock("@/app/ads/components/shared/ad-visibility-selector", () => ({ __esModule: true, default: () => null }))
jest.mock("@/app/ads/components/shared/country-selection", () => ({ __esModule: true, default: () => null }))
jest.mock("@/components/ui/tooltip", () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipArrow: () => null,
  TooltipContent: () => null,
  TooltipProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))
jest.mock("@/components/ui/spinner", () => ({ Spinner: () => null }))
// Plain passthrough so the footer button's `disabled` reflects the wizard's own
// isButtonDisabled logic rather than Quill's internal rendering.
jest.mock("@/components/ui/button", () => ({
  Button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button {...props}>{children}</button>
  ),
}))

// Stand-in for AdDetailsForm that exposes the props the wizard hands it and mirrors
// its real validity rule (a fixed draft needs a rate before Next enables).
jest.mock("@/app/ads/components/ad-details-form", () => ({
  __esModule: true,
  default: function MockAdDetailsForm({
    initialData,
    onFormDataChange,
    isRateResolving,
    isRecoveredRateFinal,
  }: {
    initialData: Record<string, unknown>
    onFormDataChange: (data: Record<string, unknown>, isValid: boolean) => void
    isRateResolving?: boolean
    isRecoveredRateFinal?: boolean
  }) {
    const priceType = (initialData.priceType as "fixed" | "float" | undefined) ?? mockCreateDraft.priceType
    const fixedRate = initialData.fixedRate
    const floatingRate = priceType === "float"
      ? (initialData.floatingRate ?? mockCreateDraft.floatingRate)
      : initialData.floatingRate
    const isValid = priceType === "fixed" ? !!fixedRate : !!floatingRate

    React.useEffect(() => {
      onFormDataChange(
        {
          type: initialData.type,
          priceType,
          fixedRate,
          floatingRate,
          buyCurrency: initialData.buyCurrency,
          forCurrency: initialData.forCurrency,
        },
        isValid,
      )
      // Mirrors the real form: its draft is mount-time state, re-synced by remount.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    renderLog.push({
      priceType: String(priceType ?? ""),
      fixedRate: fixedRate === undefined || fixedRate === null ? "" : String(fixedRate),
      rateResolving: !!isRateResolving,
    })

    return (
      <div
        data-testid="ad-details-form"
        data-price-type={String(priceType ?? "")}
        data-fixed-rate={fixedRate === undefined || fixedRate === null ? "" : String(fixedRate)}
        data-recovered-rate-final={isRecoveredRateFinal ? "true" : "false"}
      >
        {/* Mirrors the real rate section: skeleton while resolving, otherwise the
            input for whichever rate type the draft currently holds. */}
        {isRateResolving ? (
          <div data-testid="mock-rate-skeleton" />
        ) : (
          <div data-testid={priceType === "float" ? "mock-float-input" : "mock-fixed-input"} />
        )}
      </div>
    )
  },
}))

const FLOAT_ADVERT = {
  id: "42",
  type: "sell",
  account_currency: "USD",
  payment_currency: "AFN",
  exchange_rate: "3",
  exchange_rate_type: "float",
  available_amount: "100",
  completed_order_amount: "0",
  open_order_amount: "0",
  minimum_order_amount: "10",
  maximum_order_amount: "50",
  description: "",
  order_expiry_period: 15,
  available_countries: ["af"],
  is_private: false,
  minimum_trade_band: null,
  minimum_completion_rate_30day: null,
  payment_method_ids: [1],
  payment_methods: [],
}

// Same advert as the backend actually returns it for My ads: the float rate for this
// pair is already known to be gone before a single websocket frame arrives.
const FLOAT_ADVERT_RATE_DISABLED = {
  ...FLOAT_ADVERT,
  visibility_status: ["advert_float_rate_disabled"],
}

const FLOAT_ADVERT_HEALTHY = {
  ...FLOAT_ADVERT,
  visibility_status: [],
}

const setExchangeRate = (next: Partial<typeof mockExchangeRate>) => {
  Object.assign(mockExchangeRate, next)
}

const paintedCommits = () => renderLog.filter((entry) => !entry.rateResolving)

const paintedPriceTypes = () => paintedCommits().map((entry) => entry.priceType)

/**
 * The defect in user terms: the fixed input appears empty and then fills itself a
 * second later. Expressed over the commit log rather than the settled state, that is
 * "an empty fixed field was painted, and a later commit shows a value" — which is
 * exactly what a waitFor on the final value cannot see.
 */
const paintedEmptyThenFilled = () => {
  const fixedRates = paintedCommits()
    .filter((entry) => entry.priceType === "fixed")
    .map((entry) => entry.fixedRate)
  const firstEmpty = fixedRates.indexOf("")
  return firstEmpty !== -1 && fixedRates.slice(firstEmpty).some((value) => value !== "")
}

describe("MultiStepAdForm — unavailable exchange rate on a floating advert", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    renderLog.length = 0
    ;(useAdvertAlertDialog as jest.Mock).mockReturnValue({
      showAlert: mockShowAlert,
      hideAlert: jest.fn(),
    })
    ;(AdsAPI.getAdvert as jest.Mock).mockResolvedValue({ data: FLOAT_ADVERT })
    setExchangeRate({
      pairKey: "USD:AFN",
      rate: null,
      cachedRate: null,
      status: null,
      isLoading: false,
      hasResolvedStatus: false,
      hasSettled: false,
      isExplicitlyUnavailable: false,
    })
  })

  it("edit mode: recovers to a prefilled fixed rate without showing the outdated-rate dialog", async () => {
    // Feed reports the pair as dead but still carries the last known rate.
    setExchangeRate({
      rate: 68.5,
      cachedRate: 68.5,
      status: "inactive",
      hasResolvedStatus: true,
      isExplicitlyUnavailable: true,
    })

    render(<MultiStepAdForm mode="edit" adId="42" />)

    await waitFor(() => {
      expect(screen.getByTestId("ad-details-form").getAttribute("data-price-type")).toBe("fixed")
    })
    // Previous effective rate: 68.5 x (1 + 3%) = 70.555, at AFN's 2 decimals.
    expect(screen.getByTestId("ad-details-form").getAttribute("data-fixed-rate")).toBe("70.56")
    expect(mockShowAlert).not.toHaveBeenCalled()
  })

  it("edit mode: leaves the fixed rate empty and Next disabled when no rate could be recovered", async () => {
    setExchangeRate({
      rate: null,
      cachedRate: null,
      status: "inactive",
      hasResolvedStatus: true,
      isExplicitlyUnavailable: true,
    })

    render(<MultiStepAdForm mode="edit" adId="42" />)

    await waitFor(() => {
      expect(screen.getByTestId("ad-details-form").getAttribute("data-price-type")).toBe("fixed")
    })
    expect(screen.getByTestId("ad-details-form").getAttribute("data-fixed-rate")).toBe("")
    expect(mockShowAlert).not.toHaveBeenCalled()
    expect((screen.getByTestId("ad-form-btn-next-step1") as HTMLButtonElement).disabled).toBe(true)
  })

  it("create mode: still interrupts with the outdated-rate dialog when the rate goes stale", async () => {
    const { rerender } = render(<MultiStepAdForm mode="create" initialType="sell" />)

    // Rate is healthy while the user picks floating — nothing to report yet.
    await screen.findByTestId("ad-details-form")
    expect(mockShowAlert).not.toHaveBeenCalled()

    // Feed goes stale underneath the user's own choice: the dialog is warranted here.
    setExchangeRate({
      rate: 68.5,
      cachedRate: 68.5,
      status: "inactive",
      isExplicitlyUnavailable: true,
    })
    rerender(<MultiStepAdForm mode="create" initialType="sell" />)

    await waitFor(() => {
      expect(mockShowAlert).toHaveBeenCalledWith(
        expect.objectContaining({ testId: "stale-exchange-rate-dialog" }),
      )
    })
  })
})

// The recovery in the suite above is correct but reactive: it waits on the websocket
// status, while the paint was gated on exchangeRate.isLoading, which also goes false
// when the 1500ms settle timer expires. That let the float input paint for 1-2s before
// the form remounted as fixed. These tests assert on EVERY commit, not the settled one.
describe("MultiStepAdForm — first paint for a float advert whose pair has no float rate", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    renderLog.length = 0
    ;(useAdvertAlertDialog as jest.Mock).mockReturnValue({
      showAlert: mockShowAlert,
      hideAlert: jest.fn(),
    })
    // The state that produced the bug: the settle timer has released isLoading, but the
    // feed has not said anything about this pair yet.
    setExchangeRate({
      pairKey: "USD:AFN",
      rate: null,
      cachedRate: null,
      status: null,
      isLoading: false,
      hasResolvedStatus: false,
      hasSettled: false,
      isExplicitlyUnavailable: false,
    })
  })

  it("visibility_status path: never paints float, and fills the fixed rate once the market rate lands", async () => {
    ;(AdsAPI.getAdvert as jest.Mock).mockResolvedValue({ data: FLOAT_ADVERT_RATE_DISABLED })

    const { rerender } = render(<MultiStepAdForm mode="edit" adId="42" />)

    await screen.findByTestId("ad-details-form")

    // The advert itself already carried the answer, so the rate type is decided before
    // the first frame — no websocket round trip involved.
    expect(screen.getByTestId("ad-details-form").getAttribute("data-price-type")).toBe("fixed")
    expect(renderLog.every((entry) => entry.priceType === "fixed")).toBe(true)
    // No market rate yet, so the rate value is still resolving: skeleton, not an empty
    // fixed field that visibly fills in a moment later.
    expect(screen.queryByTestId("mock-float-input")).toBeNull()
    expect(screen.getByTestId("mock-rate-skeleton")).toBeTruthy()

    setExchangeRate({
      rate: 68.5,
      cachedRate: 68.5,
      status: "inactive",
      hasResolvedStatus: true,
      isExplicitlyUnavailable: true,
    })
    rerender(<MultiStepAdForm mode="edit" adId="42" />)

    await waitFor(() => {
      expect(screen.getByTestId("ad-details-form").getAttribute("data-fixed-rate")).toBe("70.56")
    })
    expect(screen.getByTestId("mock-fixed-input")).toBeTruthy()
    // The whole point: across every commit, float was never on screen.
    expect(renderLog.every((entry) => entry.priceType === "fixed")).toBe(true)
    expect(mockShowAlert).not.toHaveBeenCalled()
  })

  it("visibility_status path: the feed's settle timer no longer pre-empts a rate that lands just after it", async () => {
    // The reported flash. RATE_SETTLE_DELAY_MS is 1500ms and starts with the request;
    // on this pair the feed answers just after it. Releasing the recover gate on
    // hasSettled therefore painted an EMPTY fixed field, which the raw-market-rate
    // autofill then filled a moment later with the wrong number.
    ;(AdsAPI.getAdvert as jest.Mock).mockResolvedValue({ data: FLOAT_ADVERT_RATE_DISABLED })

    const { rerender } = render(<MultiStepAdForm mode="edit" adId="42" />)
    await screen.findByTestId("ad-details-form")
    expect(screen.getByTestId("mock-rate-skeleton")).toBeTruthy()

    // Settle timer expires with nothing received. The gate must hold: the rate TYPE is
    // already decided, what is still missing is the rate VALUE.
    setExchangeRate({ hasSettled: true })
    rerender(<MultiStepAdForm mode="edit" adId="42" />)

    expect(screen.getByTestId("mock-rate-skeleton")).toBeTruthy()
    expect(screen.queryByTestId("mock-fixed-input")).toBeNull()

    // Feed answers a moment later, as it does on this pair.
    setExchangeRate({
      rate: 68.5,
      cachedRate: 68.5,
      status: "inactive",
      hasResolvedStatus: true,
      isExplicitlyUnavailable: true,
    })
    rerender(<MultiStepAdForm mode="edit" adId="42" />)

    await waitFor(() => {
      expect(screen.getByTestId("mock-fixed-input")).toBeTruthy()
    })
    // First and only value the user ever sees is the recovered effective rate
    // (68.5 x 1.03 = 70.555 at AFN's 2 decimals) — not the raw 68.50, and not "".
    expect(screen.getByTestId("ad-details-form").getAttribute("data-fixed-rate")).toBe("70.56")
    expect(paintedEmptyThenFilled()).toBe(false)
    expect(paintedCommits().map((entry) => entry.fixedRate)).not.toContain("68.50")
  })

  it("visibility_status path: a cached rate is used at prefill, so nothing is skeletonised at all", async () => {
    // The feed now joins on the account currency alone, without waiting for the advert
    // load or the payment currency, so by the time getAdvert resolves the rate for the
    // advert's pair is usually already cached. getCachedRate reads it by explicit pair
    // key, because the hook's own pairKey is still empty at that point.
    ;(AdsAPI.getAdvert as jest.Mock).mockResolvedValue({ data: FLOAT_ADVERT_RATE_DISABLED })
    setExchangeRate({ cachedRate: 68.5 })

    render(<MultiStepAdForm mode="edit" adId="42" />)

    await screen.findByTestId("ad-details-form")
    expect(screen.getByTestId("ad-details-form").getAttribute("data-fixed-rate")).toBe("70.56")
    expect(screen.getByTestId("mock-fixed-input")).toBeTruthy()
    expect(screen.queryByTestId("mock-rate-skeleton")).toBeNull()
    expect(paintedEmptyThenFilled()).toBe(false)
  })

  it("visibility_status path: a silent feed eventually paints empty, and empty stays empty", async () => {
    jest.useFakeTimers()
    try {
      ;(AdsAPI.getAdvert as jest.Mock).mockResolvedValue({ data: FLOAT_ADVERT_RATE_DISABLED })

      const { rerender } = render(<MultiStepAdForm mode="edit" adId="42" />)
      await act(async () => {})
      expect(screen.getByTestId("mock-rate-skeleton")).toBeTruthy()

      // RECOVERED_RATE_PAINT_TIMEOUT_MS is the upper bound on the gate — long enough
      // not to pre-empt the feed, short enough that a genuinely silent feed cannot
      // skeletonise the form forever.
      await act(async () => {
        jest.advanceTimersByTime(4000)
      })

      const form = screen.getByTestId("ad-details-form")
      expect(screen.getByTestId("mock-fixed-input")).toBeTruthy()
      expect(form.getAttribute("data-fixed-rate")).toBe("")
      // Marked final so AdDetailsForm treats the empty field as the user's to fill and
      // will not autofill over it — see the isRecoveredRateFinal prop.
      expect(form.getAttribute("data-recovered-rate-final")).toBe("true")

      // A rate turning up after the field was painted must not change it.
      setExchangeRate({
        rate: 68.5,
        cachedRate: 68.5,
        status: "inactive",
        hasResolvedStatus: true,
        isExplicitlyUnavailable: true,
      })
      rerender(<MultiStepAdForm mode="edit" adId="42" />)
      await act(async () => {})

      expect(screen.getByTestId("ad-details-form").getAttribute("data-fixed-rate")).toBe("")
      expect(paintedEmptyThenFilled()).toBe(false)
    } finally {
      jest.useRealTimers()
    }
  })

  it("websocket fallback: holds the rate section skeletonised until the status truly resolves", async () => {
    // No visibility_status on the response at all — the rate type genuinely cannot be
    // decided at prefill time, so the paint has to wait for the feed.
    ;(AdsAPI.getAdvert as jest.Mock).mockResolvedValue({ data: FLOAT_ADVERT })

    const { rerender } = render(<MultiStepAdForm mode="edit" adId="42" />)

    await screen.findByTestId("ad-details-form")

    expect(screen.getByTestId("mock-rate-skeleton")).toBeTruthy()
    expect(screen.queryByTestId("mock-float-input")).toBeNull()
    expect(paintedPriceTypes()).not.toContain("float")

    setExchangeRate({
      rate: 68.5,
      cachedRate: 68.5,
      status: "inactive",
      hasResolvedStatus: true,
      isExplicitlyUnavailable: true,
    })
    rerender(<MultiStepAdForm mode="edit" adId="42" />)

    await waitFor(() => {
      expect(screen.getByTestId("ad-details-form").getAttribute("data-price-type")).toBe("fixed")
    })
    expect(screen.getByTestId("ad-details-form").getAttribute("data-fixed-rate")).toBe("70.56")
    // The skeleton must lift in the same commit that flips the draft to fixed, or the
    // flash simply moves rather than disappears.
    expect(paintedPriceTypes()).not.toContain("float")
    expect(mockShowAlert).not.toHaveBeenCalled()
  })

  it("websocket fallback: the settle timer is an upper bound — a silent feed still paints", async () => {
    ;(AdsAPI.getAdvert as jest.Mock).mockResolvedValue({ data: FLOAT_ADVERT })

    const { rerender } = render(<MultiStepAdForm mode="edit" adId="42" />)
    await screen.findByTestId("ad-details-form")
    expect(screen.getByTestId("mock-rate-skeleton")).toBeTruthy()

    // Feed never answered. Rather than skeletonise forever, paint as before the fix.
    setExchangeRate({ hasSettled: true })
    rerender(<MultiStepAdForm mode="edit" adId="42" />)

    await waitFor(() => {
      expect(screen.getByTestId("mock-float-input")).toBeTruthy()
    })
    expect(screen.getByTestId("ad-details-form").getAttribute("data-price-type")).toBe("float")
  })

  it("healthy pair: a floating advert still opens as floating with no extra skeleton", async () => {
    ;(AdsAPI.getAdvert as jest.Mock).mockResolvedValue({ data: FLOAT_ADVERT_HEALTHY })
    setExchangeRate({
      rate: 68.5,
      cachedRate: 68.5,
      status: "active",
      hasResolvedStatus: true,
      isExplicitlyUnavailable: false,
    })

    render(<MultiStepAdForm mode="edit" adId="42" />)

    await screen.findByTestId("ad-details-form")
    expect(screen.getByTestId("ad-details-form").getAttribute("data-price-type")).toBe("float")
    expect(screen.getByTestId("mock-float-input")).toBeTruthy()
    expect(screen.queryByTestId("mock-rate-skeleton")).toBeNull()
    expect(mockShowAlert).not.toHaveBeenCalled()
  })
})
