import type { AlertDialogConfig } from "@/types/alert-dialog"

type Translate = (key: string) => string

/** Opens the Intercom live chat widget when available. */
function openLiveChat() {
  if (typeof window !== "undefined" && window.Intercom) {
    window.Intercom("show")
  }
}

/**
 * Shared alert shown when a read-only account attempts a P2P mutation
 * (managing payment methods, creating/editing/deleting ads, etc.). Mirrors the
 * order flow's `UserReadOnly` handling (see lib/orders/order-error-mapper.ts):
 * the user gets a clear reason plus a route to support instead of a silent or
 * generic failure.
 *
 * The copy lives under the shared `common.readOnly*` keys so every feature
 * surfaces the same message.
 */
export function createReadOnlyAlertConfig(
  t: Translate,
  options: { onClose?: () => void } = {},
): AlertDialogConfig {
  return {
    title: t("common.readOnlyTitle"),
    description: t("common.readOnlyDescription"),
    confirmText: t("common.readOnlyOpenChat"),
    cancelText: t("common.readOnlyMaybeLater"),
    type: "warning",
    onConfirm: () => {
      openLiveChat()
      options.onClose?.()
    },
    onCancel: options.onClose,
    onClose: options.onClose,
  }
}
