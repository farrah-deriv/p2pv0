"use client"
import { AlertDialog, AlertDialogContent } from "@/components/ui/alert-dialog"
import { StandaloneCircleCheckFillIcon, StandaloneCircleExclamationRegularIcon, StandaloneXmarkRegularIcon } from "@deriv/quill-icons/Standalone"
import { Button } from "@/components/ui/button"

interface StatusModalProps {
  type: "success" | "error" | "warning"
  title: string
  message: string
  subMessage?: string
  onClose: () => void
}

export default function StatusModal({ type, title, message, subMessage, onClose }: StatusModalProps) {
  return (
    <AlertDialog open={true} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <AlertDialogContent className="p-0 overflow-hidden border-none">
        <div className="relative p-6">
          <div className="flex justify-center mb-12">
            <div
              className={`${type === "success" ? "bg-success-bg" : "bg-warning-bg"
                } rounded-full p-2 flex items-center justify-center`}
            >
              {type === "success" ? (
                <StandaloneCircleCheckFillIcon iconSize="md" className="text-success-icon" />
              ) : (
                <StandaloneCircleExclamationRegularIcon iconSize="md" className="text-warning-icon" />
              )}
            </div>

            <Button
              variant="icon-muted"
              onClick={onClose}
              className="absolute top-6 right-6 !p-1 !h-auto"
              aria-label="Close"
            >
              <StandaloneXmarkRegularIcon iconSize="sm" />
            </Button>
          </div>

          <div className="mb-12">
            <h2 className="text-xl font-semibold mb-4">{title}</h2>
            <p className="text-slate-600">{message}</p>
            {subMessage && <p className="text-slate-500 mt-4">{subMessage}</p>}
          </div>

          <Button onClick={onClose} className="w-full">
            OK
          </Button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  )
}
