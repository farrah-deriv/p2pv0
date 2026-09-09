import type { AlertDialogConfig } from "@/types/alert-dialog"

type Translate = (key: string) => string

export function createPaymentMethodDuplicateAlertConfig(
  t: Translate,
  options: {
    onManage: () => void
    onCancel?: () => void
  },
): AlertDialogConfig {
  return {
    title: t("paymentMethod.duplicateMethod"),
    description: t("paymentMethod.duplicateMethodDescription"),
    confirmText: t("paymentMethod.duplicateMethodPrimaryCta"),
    cancelText: t("common.cancel"),
    type: "warning",
    onConfirm: options.onManage,
    onCancel: options.onCancel,
    onClose: options.onCancel,
  }
}
