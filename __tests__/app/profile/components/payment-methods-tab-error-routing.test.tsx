import type { ComponentProps, ReactNode } from "react"
import jest from "jest"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"

import PaymentMethodsTab from "@/app/profile/components/payment-methods-tab"

const mockPush = jest.fn()
const mockShowAlert = jest.fn()
const mockShowDeleteDialog = jest.fn()
const mockDeletePaymentMethod = jest.fn()
const mockElevationCancelledCode = "PaymentMethodElevationCancelled"

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}))

jest.mock("next/image", () => ({
  __esModule: true,
  default: () => <span />,
}))

jest.mock("@/lib/i18n/use-translations", () => ({
  useTranslations: () => ({ t: (key: string) => key, locale: "en" }),
}))

jest.mock("@/lib/i18n/config", () => ({ isRtlLocale: () => false }))

jest.mock("@/stores/user-data-store", () => ({
  useUserDataStore: (selector: (state: { userId: string }) => unknown) => selector({ userId: "user-1" }),
}))

jest.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast: jest.fn() }) }))

jest.mock("@/hooks/use-alert-dialog", () => ({
  useAlertDialog: () => ({
    showAlert: mockShowAlert,
    showDeleteDialog: mockShowDeleteDialog,
    hideAlert: jest.fn(),
  }),
}))

jest.mock("@/hooks/use-load-more-on-scroll", () => ({
  useLoadMoreOnScroll: () => ({ sentinelRef: { current: null } }),
}))

jest.mock("@/hooks/use-api-queries", () => ({
  flattenUserPaymentMethodsPages: () => [
    {
      id: "payment-1",
      method: "bank_transfer",
      type: "bank",
      display_name: "Bank transfer",
      fields: {
        bank_name: { value: "Example Bank" },
        account: { value: "12345678" },
      },
    },
  ],
  useUserPaymentMethods: () => ({
    data: {},
    isLoading: false,
    fetchNextPage: jest.fn(),
    hasNextPage: false,
    isFetchingNextPage: false,
  }),
  useUpdatePaymentMethod: () => ({ mutateAsync: jest.fn() }),
  useDeletePaymentMethod: () => ({ mutateAsync: mockDeletePaymentMethod }),
  isPaymentMethodElevationCancelled: (error: { errors?: Array<{ code?: string }> }) =>
    error.errors?.[0]?.code === mockElevationCancelledCode,
}))

jest.mock("@/components/ui/button", () => ({
  Button: ({ children, ...props }: ComponentProps<"button">) => <button {...props}>{children}</button>,
}))

jest.mock("@/components/ui/card", () => ({
  Card: ({ children, ...props }: ComponentProps<"div">) => <div {...props}>{children}</div>,
  CardContent: ({ children, ...props }: ComponentProps<"div">) => <div {...props}>{children}</div>,
}))

jest.mock("@/components/ui/dropdown-menu", () => ({
  DropdownMenu: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DropdownMenuContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DropdownMenuItem: ({ children, onSelect, ...props }: { children: ReactNode; onSelect?: () => void }) => (
    <button {...props} onClick={onSelect}>{children}</button>
  ),
}))

jest.mock("@/app/profile/components/edit-payment-method-panel", () => () => null)
jest.mock("@/app/profile/components/ui/custom-shimmer", () => ({ CustomShimmer: () => null }))
jest.mock("@/components/empty-state", () => () => null)

describe("PaymentMethodsTab delete error routing", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it.each([
    ["PaymentMethodInUseByAdvert", "/ads"],
    ["PaymentMethodInUseByOrder", "/orders"],
  ])("routes %s to %s from the error dialog", async (errorCode, expectedRoute) => {
    mockDeletePaymentMethod.mockRejectedValueOnce(
      Object.assign(new Error("payment method in use"), { errors: [{ code: errorCode }] }),
    )

    render(<PaymentMethodsTab />)
    fireEvent.click(screen.getByTestId("profile-btn-delete-payment-payment-1"))

    const deleteConfig = mockShowDeleteDialog.mock.calls[0][0]
    deleteConfig.onConfirm()

    await waitFor(() => expect(mockShowAlert).toHaveBeenCalledTimes(1))
    const alertConfig = mockShowAlert.mock.calls[0][0]
    alertConfig.onConfirm()

    expect(mockPush).toHaveBeenCalledWith(expectedRoute)
  })

  it("does not open an error dialog when session elevation is cancelled", async () => {
    mockDeletePaymentMethod.mockRejectedValueOnce(
      Object.assign(new Error("cancelled"), {
        errors: [{ code: mockElevationCancelledCode }],
      }),
    )

    render(<PaymentMethodsTab />)
    fireEvent.click(screen.getByTestId("profile-btn-delete-payment-payment-1"))

    const deleteConfig = mockShowDeleteDialog.mock.calls[0][0]
    deleteConfig.onConfirm()

    await waitFor(() => expect(mockDeletePaymentMethod).toHaveBeenCalledTimes(1))
    expect(mockShowAlert).not.toHaveBeenCalled()
  })
})
