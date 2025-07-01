"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface StatusModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  message: string
  type?: "success" | "error" | "warning" | "info"
  confirmText?: string
  cancelText?: string
  onConfirm?: () => void
  onCancel?: () => void
}

const StatusModal = React.forwardRef<React.ElementRef<typeof Dialog>, StatusModalProps>(
  (
    {
      isOpen,
      onClose,
      title,
      message,
      type = "info",
      confirmText = "OK",
      cancelText = "Cancel",
      onConfirm,
      onCancel,
      ...props
    },
    ref,
  ) => {
    const handleConfirm = () => {
      onConfirm?.()
      onClose()
    }

    const handleCancel = () => {
      onCancel?.()
      onClose()
    }

    const getTypeStyles = () => {
      switch (type) {
        case "success":
          return "text-green-600 border-green-200"
        case "error":
          return "text-red-600 border-red-200"
        case "warning":
          return "text-yellow-600 border-yellow-200"
        default:
          return "text-blue-600 border-blue-200"
      }
    }

    return (
      <Dialog open={isOpen} onOpenChange={onClose} {...props}>
        <DialogContent className={cn("sm:max-w-md", getTypeStyles())}>
          <DialogHeader>
            <DialogTitle className="text-center">{title}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-center text-sm text-muted-foreground">{message}</p>
          </div>
          <div className="flex justify-center gap-2">
            {onCancel && (
              <Button variant="outline" onClick={handleCancel}>
                {cancelText}
              </Button>
            )}
            <Button onClick={handleConfirm}>{confirmText}</Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  },
)

StatusModal.displayName = "StatusModal"

export default StatusModal
export { StatusModal }
