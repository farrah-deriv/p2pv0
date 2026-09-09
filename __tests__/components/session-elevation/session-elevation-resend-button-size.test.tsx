import jest from "jest"
import { act, render, screen } from "@testing-library/react"

// Capture the size the Button wrapper resolves and hands to Quill. The bug was
// invisible at the wrapper's own API level: the call site simply omitted `size`,
// so `components/ui/button.tsx` fell back to "default" -> Quill "lg".
jest.mock("@deriv-com/quill-ui-v2", () => ({
  Button: ({ children, size, ...rest }: { children: React.ReactNode; size?: string }) => (
    <button data-quill-size={size} {...rest}>
      {children}
    </button>
  ),
}))

jest.mock("@/components/ui/panel-wrapper", () => ({
  PanelWrapper: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

jest.mock("@/components/ui/input-otp", () => ({
  InputOTP: () => <div data-testid="otp-input" />,
}))

jest.mock("@/components/ui/spinner", () => ({
  Spinner: () => <div data-testid="spinner" />,
}))

jest.mock("@/lib/i18n/use-translations", () => ({
  useTranslations: () => ({
    t: (key: string) => key,
    locale: "en",
  }),
}))

jest.mock("@/services/api/api-session-elevation", () => ({
  SessionElevationError: class extends Error {},
  getElevationPhone: jest.fn().mockResolvedValue("+60123456789"),
  startElevation: jest.fn().mockResolvedValue({ id: "flow-1" }),
  verifyElevation: jest.fn().mockResolvedValue(undefined),
}))

jest.mock("@/stores/session-elevation-store", () => ({
  useSessionElevationStore: (selector: (state: unknown) => unknown) =>
    selector({
      isOpen: true,
      action: { type: "payment_method_create" },
      close: jest.fn(),
      complete: jest.fn(),
    }),
}))

jest.mock("@/stores/user-data-store", () => ({
  useUserDataStore: (selector: (state: unknown) => unknown) =>
    selector({ userData: { email: "someone@example.com" } }),
}))

import { SessionElevationSidebar } from "@/components/session-elevation/session-elevation-sidebar"

// The resend button only renders once the 59-second countdown reaches zero.
const RESEND_SECONDS = 59

async function renderWithCountdownElapsed() {
  render(<SessionElevationSidebar />)
  await act(async () => {
    jest.advanceTimersByTime(RESEND_SECONDS * 1000)
  })
}

describe("SessionElevationSidebar resend button", () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  // The order-confirmation resend button
  // (app/orders/components/payment-received-confirmation-sidebar.tsx) and the
  // login resend button (app/login/login-form.tsx) both pass size="sm", which
  // components/ui/button.tsx maps to Quill "sm". Session elevation must match.
  it("renders at Quill size sm, matching the order-confirmation resend button", async () => {
    await renderWithCountdownElapsed()

    const resend = screen.getByRole("button", { name: "login.resendCode" })

    expect(resend).toHaveAttribute("data-quill-size", "sm")
  })

  it("does not fall back to the default large Quill size", async () => {
    await renderWithCountdownElapsed()

    const resend = screen.getByRole("button", { name: "login.resendCode" })

    expect(resend).not.toHaveAttribute("data-quill-size", "lg")
  })
})
