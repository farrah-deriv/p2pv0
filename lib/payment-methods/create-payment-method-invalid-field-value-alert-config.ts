import type { AlertDialogConfig } from "@/types/alert-dialog"

type Translate = (key: string, params?: Record<string, string | number>) => string

export function createPaymentMethodInvalidFieldValueAlertConfig(
  t: Translate,
  options: {
    fieldValue: string
    onEdit?: () => void
    onCancel?: () => void
  },
): AlertDialogConfig {
  return {
    title: t("paymentMethod.invalidFieldValueTitle", { fieldValue: options.fieldValue }),
    description: t("paymentMethod.invalidFieldValueDescription", { fieldValue: options.fieldValue }),
    confirmText: t("paymentMethod.editDetails"),
    cancelText: t("common.cancel"),
    type: "warning",
    onConfirm: options.onEdit,
    onCancel: options.onCancel,
    onClose: options.onCancel,
  }
}
