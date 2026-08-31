import type { AlertDialogConfig } from "@/types/alert-dialog"

type Translate = (key: string, params?: Record<string, string | number>) => string

/** Pulls the backend error code off a rejected P2P API call, if it carries one. */
export function getApiErrorCode(error: unknown): string | undefined {
  const errors = (error as { errors?: Array<{ code?: string }> } | null)?.errors
  return errors?.[0]?.code
}

/**
 * Default alert for a mutation that failed with no code-specific mapping.
 * Code-specific configs (PaymentMethodDuplicate, OrderTempLocked, ...) keep their own
 * copy and CTAs — this is only the fallback so a generic failure is never silent.
 */
export function createGenericMutationErrorAlertConfig(
  t: Translate,
  options: {
    errorCode?: string
    onConfirm?: () => void
  } = {},
): AlertDialogConfig {
  return {
    title: t("common.somethingWentWrong"),
    description: t("nps.errorMessage", { errorCode: options.errorCode || "unknown" }),
    confirmText: t("common.gotIt"),
    type: "warning",
    onConfirm: options.onConfirm,
  }
}
