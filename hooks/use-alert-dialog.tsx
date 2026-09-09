"use client"

import { useAlertDialog as useAlertDialogContext } from "@/contexts/alert-dialog-context"
import { useTranslations } from "@/lib/i18n/use-translations"
import type { AlertDialogConfig } from "@/types/alert-dialog"

export function useAlertDialog() {
  const { showAlert, hideAlert, isOpen } = useAlertDialogContext()
  const { t } = useTranslations()

  const showConfirmDialog = (config: AlertDialogConfig) => {
    showAlert({
      confirmText: t("common.confirm"),
      cancelText: t("common.cancel"),
      ...config,
    })
  }

  const showDeleteDialog = (config: Omit<AlertDialogConfig, "variant">) => {
    showAlert({
      title: t("common.deleteItemTitle"),
      description: t("common.deleteItemDescription"),
      confirmText: t("common.delete"),
      cancelText: t("common.cancel"),
      variant: "destructive",
      type: "warning",
      ...config,
    })
  }

  const showWarningDialog = (config: AlertDialogConfig) => {
    showAlert({
      title: t("common.warning"),
      confirmText: t("common.continue"),
      cancelText: t("common.cancel"),
      ...config,
    })
  }

  return {
    showAlert,
    showConfirmDialog,
    showDeleteDialog,
    showWarningDialog,
    hideAlert,
    isOpen,
  }
}
