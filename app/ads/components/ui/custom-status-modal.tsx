"use client"
import { AlertDialog, AlertDialogContent } from "@/components/ui/alert-dialog"
import { StandaloneCircleCheckFillIcon, StandaloneCircleExclamationRegularIcon, StandaloneXmarkRegularIcon } from "@deriv/quill-icons/Standalone"
import { Button } from "@/components/ui/button" // Import Button for style override

interface CustomStatusModalProps {
  type: "success" | "error" | "warning"
  title: string
  message: string
  subMessage?: string
  onClose: () => void
  adId?: string
  adType?: string
  actionButtonText?: string
}

export default function CustomStatusModal({
  type,
  title,
  message,
  subMessage,
  onClose,
  adId,
  adType,
  actionButtonText = "OK",
}: CustomStatusModalProps) {
  // Common modal styles
  const modalStyles = {
    width: "512px",
    minWidth: "512px",
    maxWidth: "512px",
    maxHeight: "748.8px",
    borderRadius: "32px",
  }

  return (
    <AlertDialog open={true} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <AlertDialogContent className="p-0 overflow-hidden border-none" style={modalStyles}>
        <div className="relative p-6">
          {/* Top section with icon and close button */}
          <div className="flex justify-center mb-12">
            <div
              className={`${
                type === "success" ? "bg-success-bg" : "bg-warning-bg"
              } rounded-[80px] p-2 flex items-center justify-center w-[56px] h-[56px]`}
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

          {/* Content section - left aligned */}
          <div className="mb-12">
            <h2 className="mb-6 text-2xl font-extrabold leading-none tracking-normal">{title}</h2>

            {type === "success" && (
              <>
                <p
                  className="text-gray-900 mb-6"
                  style={{
                    fontSize: "16px",
                    lineHeight: "24px",
                    letterSpacing: "0%",
                    fontWeight: 400,
                  }}
                >
                  You've successfully created Ad{adType && adId ? ` (${adType} ${adId})` : "."}
                </p>

                <p
                  className="text-gray-900"
                  style={{
                    fontSize: "16px",
                    lineHeight: "24px",
                    letterSpacing: "0%",
                    fontWeight: 400,
                  }}
                >
                  {message}
                </p>
              </>
            )}

            {type !== "success" && (
              <p
                className="text-gray-900"
                style={{
                  fontSize: "16px",
                  lineHeight: "24px",
                  letterSpacing: "0%",
                  fontWeight: 400,
                }}
              >
                {message}
              </p>
            )}

            {subMessage && (
              <p
                className="text-gray-900 mt-6"
                style={{
                  fontSize: "16px",
                  lineHeight: "24px",
                  letterSpacing: "0%",
                  fontWeight: 400,
                }}
              >
                {subMessage}
              </p>
            )}
          </div>

          {/* Button at the bottom - using Button component with style override */}
          <Button
            onClick={onClose}
            className="w-full h-14 !bg-blue-200 hover:!bg-cyan-hover text-black !rounded-full font-bold"
          >
            {actionButtonText}
          </Button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  )
}
