import React from "react"
import { render, screen, waitFor } from "@testing-library/react"
import AdDetailsForm from "@/app/ads/components/ad-details-form"
import jest from "jest"

const noop = () => undefined

// Stable references: several effects in AdDetailsForm list these in dependency
// arrays, so a fresh object per render would re-fire them forever.
jest.mock("@/lib/i18n/use-translations", () => {
  const translations = { t: (key: string) => key, locale: "en" }
  return { useTranslations: () => translations }
})

jest.mock("next/image", () => ({
  __esModule: true,
  // eslint-disable-next-line @next/next/no-img-element
  default: ({ alt }: { alt: string }) => <img alt={alt} />,
}))

jest.mock("@/hooks/use-account-currencies", () => {
  const result = {
    accountCurrencies: [
      { code: "AFN", name: "Afghan afghani", decimal: { minimum: 2, maximum: 2 } },
      { code: "USD", name: "US Dollar", decimal: { minimum: 2, maximum: 2 } },
    ],
    isLoading: false,
    error: null,
  }
  return { useAccountCurrencies: () => result }
})

jest.mock("@/hooks/use-api-queries", () => {
  const settings = {
    data: {
      float_rate_enabled: true,
      countries: [{ code: "af", currency: "AFN", currency_name: "Afghan afghani" }],
    },
    isLoading: false,
  }
  const advertStats = { data: undefined }
  return {
    useSettings: () => settings,
    useAdvertStats: () => advertStats,
  }
})

jest.mock("@/hooks/use-mobile", () => ({ useIsMobile: () => false }))
jest.mock("@/analytics/useTrackers", () => {
  const result = { track: () => undefined }
  return { useTrackers: () => result }
})

// Plain passthrough so `disabled` and `className` land on a real <button> and the
// test can assert on what the user would actually see, rather than on Quill internals.
jest.mock("@/components/ui/button", () => ({
  Button: React.forwardRef(function MockButton(
    { children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>,
    ref: React.Ref<HTMLButtonElement>,
  ) {
    return (
      <button ref={ref} {...props}>
        {children}
      </button>
    )
  }),
}))

jest.mock("@/components/ui/tooltip", () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipArrow: () => null,
  TooltipContent: () => null,
  TooltipProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

jest.mock("@/components/ui/drawer", () => ({
  Drawer: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  DrawerContent: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

jest.mock("@/app/ads/components/ui/trade-type-selector", () => ({
  TradeTypeSelector: () => null,
}))

const CURRENCIES = [
  { code: "AFN", name: "Afghan afghani" },
  { code: "USD", name: "US Dollar" },
]

const baseExchangeRate = {
  pairKey: "USD:AFN",
  rate: null as number | null,
  cachedRate: null as number | null,
  status: null as string | null,
  isLoading: false,
  hasResolvedStatus: false,
  hasSettled: false,
  isExplicitlyUnavailable: false,
  getCachedRate: () => null,
}

const renderForm = (
  props: Partial<React.ComponentProps<typeof AdDetailsForm>> = {},
  exchangeRate: Partial<typeof baseExchangeRate> = {},
) =>
  render(
    <AdDetailsForm
      onNext={noop}
      onFormDataChange={noop}
      currencies={CURRENCIES}
      exchangeRate={{ ...baseExchangeRate, ...exchangeRate }}
      {...props}
    />,
  )

const fixedRateInput = () => screen.getByRole("spinbutton") as HTMLInputElement

// Mobile parity: docs/.maestro/flows/my_ads/edit-ad.flow.md — "CreateEditAdPage1
// disables the ad type toggle, account currency selector, and rate type selector in
// edit mode". Web left the currency dropdown fully interactive and the rate-type
// trigger merely inert-but-white, which reads as enabled.
describe("AdDetailsForm — currency and rate type are locked in edit mode", () => {
  it("disables the payment-currency dropdown and greys it", () => {
    renderForm(
      {
        isEditMode: true,
        initialData: { type: "sell", priceType: "fixed", fixedRate: 70.56, buyCurrency: "USD", forCurrency: "AFN" },
      },
      { rate: 68.5, status: "active", hasResolvedStatus: true },
    )

    const trigger = screen.getByTestId("ad-form-select-payment-currency") as HTMLButtonElement
    expect(trigger.disabled).toBe(true)
    // The forced white fill is what made a locked control look enabled.
    expect(trigger.className).not.toContain("!bg-white")
    expect(trigger.className).toContain("!bg-grayscale-500")
    expect(trigger.className).toContain("!cursor-not-allowed")
  })

  it("disables the rate-type dropdown and greys it", () => {
    renderForm(
      {
        isEditMode: true,
        initialData: { type: "sell", priceType: "float", floatingRate: 3, buyCurrency: "USD", forCurrency: "AFN" },
      },
      { rate: 68.5, status: "active", hasResolvedStatus: true },
    )

    // The rate-type dropdown only exists when floating is choosable at all; the
    // collapsed "Rate (fixed)" heading path is unaffected by this change.
    const trigger = screen.getByRole("button", { name: /adForm.floating/ }) as HTMLButtonElement
    expect(trigger.disabled).toBe(true)
    expect(trigger.className).not.toContain("!bg-white")
    expect(trigger.className).toContain("!bg-grayscale-500")
  })

  it("leaves both dropdowns interactive in create mode", () => {
    renderForm(
      {
        isEditMode: false,
        initialData: { type: "sell", priceType: "float", floatingRate: 3, buyCurrency: "USD", forCurrency: "AFN" },
      },
      { rate: 68.5, status: "active", hasResolvedStatus: true },
    )

    const currencyTrigger = screen.getByTestId("ad-form-select-payment-currency") as HTMLButtonElement
    const rateTypeTrigger = screen.getByRole("button", { name: /adForm.floating/ }) as HTMLButtonElement
    expect(currencyTrigger.disabled).toBe(false)
    expect(rateTypeTrigger.disabled).toBe(false)
    expect(currencyTrigger.className).toContain("!bg-white")
  })
})

describe("AdDetailsForm — autofill into a draft downgraded from floating", () => {
  // buildRecoveredRateFormData spreads the previous draft, so floatingRate survives on
  // a recovered draft and the previous effective rate stays computable.
  const RECOVERED_DRAFT = {
    type: "sell" as const,
    priceType: "fixed" as const,
    fixedRate: "" as const,
    floatingRate: 3,
    buyCurrency: "USD",
    forCurrency: "AFN",
  }

  it("writes the effective rate, not the raw market rate, when the rate arrives late", async () => {
    const { rerender } = renderForm({ isEditMode: true, initialData: RECOVERED_DRAFT })

    expect(fixedRateInput().value).toBe("")

    rerender(
      <AdDetailsForm
        onNext={noop}
        onFormDataChange={noop}
        currencies={CURRENCIES}
        isEditMode
        initialData={RECOVERED_DRAFT}
        exchangeRate={{ ...baseExchangeRate, rate: 68.5, cachedRate: 68.5, status: "inactive", hasResolvedStatus: true }}
      />,
    )

    // 68.5 x (1 + 3%) = 70.555 at AFN's 2 decimals. The raw 68.50 is a different ad.
    await waitFor(() => {
      expect(fixedRateInput().value).toBe("70.56")
    })
  })

  it("leaves a final recovered rate empty when the rate arrives late", async () => {
    // isRecoveredRateFinal means the wizard already gave up waiting and painted an
    // empty field for the user to type into. Empty must stay empty.
    const { rerender } = renderForm({
      isEditMode: true,
      isRecoveredRateFinal: true,
      initialData: RECOVERED_DRAFT,
    })

    expect(fixedRateInput().value).toBe("")

    rerender(
      <AdDetailsForm
        onNext={noop}
        onFormDataChange={noop}
        currencies={CURRENCIES}
        isEditMode
        isRecoveredRateFinal
        initialData={RECOVERED_DRAFT}
        exchangeRate={{ ...baseExchangeRate, rate: 68.5, cachedRate: 68.5, status: "inactive", hasResolvedStatus: true }}
      />,
    )

    await waitFor(() => {
      expect(fixedRateInput().value).toBe("")
    })
  })

  it("still autofills the raw market rate for an ordinary fixed draft", async () => {
    // No floatingRate on the draft means nothing was downgraded, so there is no
    // effective rate to recompute — create mode must be unaffected.
    const { rerender } = renderForm({
      initialData: { type: "sell", priceType: "fixed", buyCurrency: "USD", forCurrency: "AFN" },
    })

    rerender(
      <AdDetailsForm
        onNext={noop}
        onFormDataChange={noop}
        currencies={CURRENCIES}
        initialData={{ type: "sell", priceType: "fixed", buyCurrency: "USD", forCurrency: "AFN" }}
        exchangeRate={{ ...baseExchangeRate, rate: 68.5, cachedRate: 68.5, status: "active", hasResolvedStatus: true }}
      />,
    )

    await waitFor(() => {
      expect(fixedRateInput().value).toBe("68.50")
    })
  })
})
