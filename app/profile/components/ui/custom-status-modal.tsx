"use client"
import { AlertDialog, AlertDialogContent } from "@/components/ui/alert-dialog"
import { CheckCircle, AlertCircle, X } from "lucide-react"

interface CustomStatusModalProps {
  type: "success" | "error" | "warning"
  title: string
  message: string
  subMessage?: string
  onClose: () => void
}

export default function CustomStatusModal({ type, title, message, subMessage, onClose }: CustomStatusModalProps) {
  return (
    <AlertDialog open={true} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <AlertDialogContent className="p-0 overflow-hidden border-none">
        <div className="relative p-6">
          {/* Top section with icon and close button */}
          <div className="flex justify-center mb-12">
            <div
              className={`${
                type === "success" ? "bg-green-100" : "bg-yellow-100"
              } rounded-full p-2 flex items-center justify-center`}
            >
              {type === "success" ? (
                <CheckCircle className="h-8 w-8 text-green-600" />
              ) : (
                <AlertCircle className="h-8 w-8 text-yellow-600" />
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

          {/* Button at the bottom */}
          <button
            onClick={onClose}
            className="w-full h-10 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            OK
          </button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  )
}
