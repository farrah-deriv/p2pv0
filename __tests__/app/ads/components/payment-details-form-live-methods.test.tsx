import { render, screen, fireEvent, act } from "@testing-library/react"
import PaymentDetailsForm from "@/app/ads/components/payment-details-form"
import { PaymentSelectionProvider } from "@/app/ads/components/payment-selection-context"
import { useUserPaymentMethods, useAddPaymentMethod } from "@/hooks/use-api-queries"
import { useAdvertAlertDialog } from "@/app/ads/hooks/use-advert-alert-dialog"
import jest from "jest"

/**
 * Regression cover for the stale-snapshot defect in the sell-ad payment sheet.
 *
 * `userPaymentMethods` reaches this component as a PROP that multi-step-ad-form
 * syncs from the query inside an effect, so for the render right after page 1
 * lands the prop is still `[]` while `useUserPaymentMethods()` already holds the
 * methods. Both assertions below fail on the pre-fix code, which read the prop:
 *   - the sheet opens against `[]` instead of the live list
 *   - the post-add merge is seeded from `[]`, so the max-3 / same-key e-wallet
 *     guard cannot see the already-selected method and wrongly auto-selects the
 *     newly created duplicate-key e-wallet
 */

const mockShowAlert = jest.fn()
const mockHideAlert = jest.fn()
const mockAddPaymentMethod = jest.fn()

jest.mock("@/hooks/use-api-queries", () => {
  const actual = jest.requireActual("@/hooks/use-api-queries")
  return {
    // Keep the real flattener — this spec is about which list is read, not how
    // pages are flattened.
    flattenUserPaymentMethodsPages: actual.flattenUserPaymentMethodsPages,
    isPaymentMethodElevationCancelled: () => false,
    useUserPaymentMethods: jest.fn(),
    useAddPaymentMethod: jest.fn(),
  }
})

jest.mock("@/app/ads/hooks/use-advert-alert-dialog", () => ({
  useAdvertAlertDialog: jest.fn(),
}))

jest.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: jest.fn() }),
}))

jest.mock("@/hooks/use-account-currencies", () => ({
  useAccountCurrencies: () => ({ accountCurrencies: [], isLoading: false, error: null }),
}))

jest.mock("@/lib/hooks/use-is-mobile", () => ({
  useIsMobile: () => false,
}))

jest.mock("@/lib/i18n/use-translations", () => ({
  useTranslations: () => ({ t: (key: string) => key, locale: "en" }),
}))

jest.mock("next/image", () => ({
  __esModule: true,
  default: ({ alt }: { alt: string }) => <img alt={alt} />,
}))

jest.mock("@/app/profile/components/add-payment-method-panel", () => ({
  __esModule: true,
  default: ({ onAdd }: { onAdd: (method: string, fields: Record<string, string>) => void }) => (
    <button type="button" data-testid="stub-add-panel-submit" onClick={() => onAdd("skrill", {})}>
      add
    </button>
  ),
}))

/** Already saved and selectable — only the live query knows about it. */
const savedSkrill = {
  id: "1",
  method: "skrill",
  type: "ewallet",
  display_name: "Skrill",
  fields: { account: { value: "first@example.com" } },
  is_enabled: 1,
}

/** A second skrill account, returned by the create call. */
const createdSkrill = {
  id: "2",
  method: "skrill",
  type: "ewallet",
  display_name: "Skrill",
  fields: { account: { value: "second@example.com" } },
  is_enabled: 1,
}

/** The last config handed to showAlert — the selection sheet is opened this way. */
const lastSheetProps = () => {
  const calls = mockShowAlert.mock.calls
  return calls[calls.length - 1][0].content.props
}

const renderForm = () =>
  render(
    <PaymentSelectionProvider>
      <PaymentDetailsForm
        initialData={{ type: "sell", buyCurrency: "USD" }}
        onFormDataChange={jest.fn()}
        userPaymentMethods={[]}
        availablePaymentMethods={[]}
        onRefetchPaymentMethods={jest.fn().mockResolvedValue(undefined)}
      />
    </PaymentSelectionProvider>,
  )

describe("PaymentDetailsForm — sell-side selection sheet reads the live method list", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useAdvertAlertDialog as jest.Mock).mockReturnValue({
      showAlert: mockShowAlert,
      hideAlert: mockHideAlert,
    })
    ;(useAddPaymentMethod as jest.Mock).mockReturnValue({
      mutateAsync: mockAddPaymentMethod,
      isPending: false,
    })
    // Page 1 has landed in the query, but the parent effect has not yet pushed
    // it into the `userPaymentMethods` prop.
    ;(useUserPaymentMethods as jest.Mock).mockReturnValue({
      data: { pages: [{ data: [savedSkrill] }] },
      isPending: false,
      hasNextPage: false,
      fetchNextPage: jest.fn(),
      isFetchingNextPage: false,
    })
  })

  it("opens the sheet with the live methods while the prop is still empty", () => {
    renderForm()

    fireEvent.click(screen.getByTestId("ad-form-btn-select-payment"))

    expect(mockShowAlert).toHaveBeenCalled()
    expect(lastSheetProps().paymentMethods).toEqual([savedSkrill])
  })

  it("builds the post-add merge from the live list, so the same-key e-wallet guard still applies", async () => {
    mockAddPaymentMethod.mockResolvedValue({ data: createdSkrill })
    renderForm()

    fireEvent.click(screen.getByTestId("ad-form-btn-select-payment"))
    // Pick the saved skrill, then leave for the add-payment panel the way the
    // sheet's own "add" affordance does.
    act(() => {
      lastSheetProps().handleAddPaymentMethodClick(["1"])
    })

    await act(async () => {
      fireEvent.click(screen.getByTestId("stub-add-panel-submit"))
    })

    const reopened = lastSheetProps()
    // Live method preserved alongside the created one.
    expect(reopened.paymentMethods).toEqual([savedSkrill, createdSkrill])
    // Same `method` key as the already-selected e-wallet, so it must NOT be
    // auto-selected. Seeded from the empty prop the guard saw no conflict and
    // appended "2".
    expect(reopened.tempSelectedPaymentMethods).toEqual(["1"])
  })
})
