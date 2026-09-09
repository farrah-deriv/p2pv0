import type React from "react"

export interface AlertDialogConfig {
  title?: string
  description?: string
  confirmText?: string
  cancelText?: string
  variant?: "default" | "destructive"
  type?: "warning" | "info" | "error" | "success"
  size?: "default" | "kycOnboarding"
  contentClassName?: string
  /** Mobile-only content sizing; falls back to contentClassName when omitted. */
  mobileContentClassName?: string
  /** Mobile-only DrawerContent sizing/stacking overrides (pure styling — does not affect layout behavior). */
  mobileSheetClassName?: string
  /** Explicit opt-in: unlocks the inner container from max-h-[80vh] to h-full so a fixed-height mobileSheetClassName isn't fighting the default max-height. */
  mobileSheetFullHeight?: boolean
  /** Optional override for title typography (e.g. advert sheets: text-2xl font-extrabold). */
  titleClassName?: string
  /**
   * Tighter handle→title gap for bottom sheets (12px / pt-3).
   * Use for advert sheets so spacing matches mobile BottomSheetHandle.
   */
  compactSheetHeader?: boolean
  /** Mobile drawer title alignment. Desktop header stays start-aligned. */
  titleAlign?: "start" | "center"
  content?: React.ReactNode
  onConfirm?: () => void | Promise<void>
  onCancel?: () => void
  onClose?: () => void
  hideCloseButton?: boolean
  /** When true, Escape key and outside-click cannot close the dialog — user must use a CTA button. */
  preventOutsideClose?: boolean
  testId?: string
  confirmTestId?: string
  cancelTestId?: string
}

export interface AlertDialogContextType {
  showAlert: (config: AlertDialogConfig) => void
  hideAlert: () => void
  isOpen: boolean
}
