"use client"

import { useAlertDialog } from "@/hooks/use-alert-dialog"
import { cn } from "@/lib/utils"
import type { AlertDialogConfig } from "@/types/alert-dialog"

/** Matches mobile advert bottom-sheet titles: 24px / weight 800. */
export const ADVERT_SHEET_TITLE_CLASSNAME = "text-2xl font-extrabold"

function withAdvertSheetTitle(config: AlertDialogConfig): AlertDialogConfig {
  return {
    ...config,
    compactSheetHeader: true,
    titleClassName: cn(ADVERT_SHEET_TITLE_CLASSNAME, config.titleClassName),
  }
}

/** Same as useAlertDialog, but forces advert sheet title typography. */
export function useAdvertAlertDialog() {
  const dialog = useAlertDialog()

  return {
    ...dialog,
    showAlert: (config: AlertDialogConfig) => dialog.showAlert(withAdvertSheetTitle(config)),
    showConfirmDialog: (config: AlertDialogConfig) =>
      dialog.showConfirmDialog(withAdvertSheetTitle(config)),
    showDeleteDialog: (config: Omit<AlertDialogConfig, "variant">) =>
      dialog.showDeleteDialog(withAdvertSheetTitle(config)),
    showWarningDialog: (config: AlertDialogConfig) =>
      dialog.showWarningDialog(withAdvertSheetTitle(config)),
  }
}
