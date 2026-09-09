import type { AlertDialogConfig } from "@/types/alert-dialog"

type Translate = (key: string, params?: Record<string, string | number>) => string

export function createEmailRequiredAlertConfig(
  t: Translate,
  options: {
    onAddEmail: () => void
    onDismiss?: () => void
  },
): AlertDialogConfig {
  return {
    title: t("emailRequired.title"),
    description: t("emailRequired.description"),
    confirmText: t("emailRequired.addEmail"),
    type: "info",
    testId: "email-required-dialog",
    confirmTestId: "email-required-btn-add",
    onConfirm: options.onAddEmail,
    onClose: options.onDismiss,
  }
}
