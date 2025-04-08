"use client"
import { AlertDialog, AlertDialogContent } from "@/components/ui/alert-dialog"
import { CheckCircle, AlertCircle, X } from "lucide-react"
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
          {/* Top section with icon and close button */}
          <div className="flex justify-center mb-12">
            <div
              className={`${
                type === "success" ? "bg-success-bg" : "bg-warning-bg"
              } rounded-full p-2 flex items-center justify-center`}
            >
              {type === "success" ? (
                <CheckCircle className="h-8 w-8 text-success-icon" />
              ) : (
                <AlertCircle className="h-8 w-8 text-warning-icon" />
              )}
            </div>

            <button
              onClick={onClose}
              className="absolute top-6 right-6 text-gray-400 hover:text-gray-600"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content section - left aligned */}
          <div className="mb-12">
            <h2 className="text-xl font-semibold mb-4">{title}</h2>
            <p className="text-gray-700">{message}</p>
            {subMessage && <p className="text-gray-500 mt-4">{subMessage}</p>}
          </div>

          {/* Button at the bottom - Updated to use Button with cyan variant */}
          <Button onClick={onClose} variant="cyan" size="default" className="w-full">
            OK
          </Button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  )
}
