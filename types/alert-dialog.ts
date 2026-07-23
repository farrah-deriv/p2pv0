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
