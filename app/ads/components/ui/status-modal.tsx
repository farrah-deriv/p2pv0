"use client"
import { AlertDialog, AlertDialogContent } from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import Image from "next/image"

interface StatusModalProps {
  type: "success" | "error" | "warning"
  title: string
  message: string
  subMessage?: string
  onClose: () => void
  adId?: string
  adType?: string
  actionButtonText?: string
  isUpdate?: boolean
  showStatusModel: boolean
}

export default function StatusModal({
  type,
  title,
  message,
  subMessage,
  onClose,
  adId,
  adType,
  actionButtonText = "OK",
  isUpdate = false,
  showStatusModel=false,
}: StatusModalProps) {
  const modalStyles = {
    width: "512px",
    minWidth: "512px",
    maxWidth: "512px",
    maxHeight: "748.8px",
    borderRadius: "32px",
  }

  return (
    <AlertDialog open={showStatusModel} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <AlertDialogContent className="p-0 overflow-hidden border-none" style={modalStyles}>
        <div className="bg-gray-100 relative p-6 pb-12">
          <div className="flex justify-center">
            {type === "success" ? (
              <Image src="/icons/success_icon_round.png" alt="Success" width={56} height={56} className="w-14 h-14" />
            ) : (
              <Image src="/icons/error_icon_round.png" alt="Error" width={56} height={56} className="w-14 h-14" />
            )}
          </div>

          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="absolute top-6 right-6 text-black hover:text-gray-700 p-2"
            aria-label="Close"
          >
            <Image src="/icons/button-close.png" alt="Close" width={48} height={48} className="w-12 h-12" />
          </Button>
        </div>

        <div className="p-6">
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
                  {isUpdate
                    ? `You've successfully updated Ad${adType && adId ? ` (${adType} ${adId})` : "."}`
                    : `You've successfully created Ad${adType && adId ? ` (${adType} ${adId})` : "."}`}
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

          <Button onClick={onClose} className="w-full">
            {actionButtonText}
          </Button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  )
}
