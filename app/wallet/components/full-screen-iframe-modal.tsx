"use client"

import { StandaloneXmarkRegularIcon } from "@deriv/quill-icons/Standalone"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { useUserDataStore } from "@/stores/user-data-store"
import { getCoreUrl } from "@/lib/get-core-url"
import { useTranslations } from "@/lib/i18n/use-translations"

interface IframeResponse {
  status: string
  data: {
    iframe_url: string
  }
  message: string
}

interface FullScreenIframeModalProps {
  isOpen: boolean
  onClose: () => void
  operation?: "DEPOSIT" | "WITHDRAW"
  currency?: string
}

export default function FullScreenIframeModal({
  isOpen,
  onClose,
  operation = "DEPOSIT",
  currency = "USD",
}: FullScreenIframeModalProps) {
  const { t } = useTranslations()
  const router = useRouter()
  const userData = useUserDataStore((state) => state.userData)
  const walletId = userData?.wallet_id
  const brandClientId = useUserDataStore((state) => state.brandClientId)
  const brand = useUserDataStore((state) => state.brand)
  const [iframeUrl, setIframeUrl] = useState<string>("")
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [iframeLoaded, setIframeLoaded] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  useEffect(() => {
    if (!isOpen) return

    const fetchIframeUrl = async () => {
      setIsLoading(true)
      setIframeLoaded(false)
      setError(null)

      try {
        const cashierUrl = `${getCoreUrl()}/v1/cashier/url`
        const apiOperation = operation === "WITHDRAW" ? "PAYOUT" : operation
        const params = new URLSearchParams({
          wallet_id: walletId || "",
          operation: apiOperation,
          currency,
        })

        if (brandClientId) {
          params.append("user_id", brandClientId)
        }

        if (brand) {
          params.append("brand_id", brand)
        }

        const response = await fetch(`${cashierUrl}?${params.toString()}`, {
          method: "GET",
          credentials: "include",
        })

        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`API request failed with status ${response.status}: ${errorText}`)
        }

        const data: IframeResponse = await response.json()

        if (!data.data?.iframe_url) {
          throw new Error("No iframe URL returned from API")
        }

        setIframeUrl(data.data.iframe_url)
        setIsLoading(false)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch iframe URL")
        setIsLoading(false)
      }
    }

    fetchIframeUrl()
  }, [isOpen, operation, currency, walletId, brandClientId, brand])

  const handleIframeLoad = () => {
    setIframeLoaded(true)
  }

  const handleClose = () => {
    onClose()
    router.push("/wallet")
  }

  if (!isOpen || !mounted) return null

  const title = operation === "DEPOSIT" ? t("wallet.depositToP2p") : t("wallet.withdrawFromP2p")

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-background flex flex-col">
      <div className="flex h-16 px-4 py-1 justify-between items-center border-b border-border bg-background z-10">
        <h1 className="text-lg font-bold text-black leading-7">{title}</h1>
        <Button
          variant="icon-muted"
          size="icon"
          onClick={handleClose}
          className="flex w-8 h-8 items-center justify-center rounded-full aspect-square overflow-hidden flex-shrink-0 min-w-[2rem] min-h-[2rem] max-w-[2rem] max-h-[2rem] bg-grayscale-700 hover:bg-grayscale-700 p-0"
          aria-label={t("common.close")}
        >
          <StandaloneXmarkRegularIcon iconSize="xs" />
        </Button>
      </div>

      <div className="flex-1 w-full relative">
        {(!iframeLoaded || isLoading) && (
          <div className="absolute inset-0 flex items-center justify-center bg-background z-10">
            <div className="flex flex-col items-center">
              <Spinner size="lg" className="mb-4" />
              <p className="text-muted-foreground">{t("common.loading")}</p>
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center justify-center h-full">
            <div className="text-destructive text-center p-4">
              <p className="text-lg font-semibold">{t("common.errorLoadingPage")}</p>
              <p className="mt-2">{error}</p>
              <Button
                variant="default"
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
              >
                {t("wallet.tryAgain")}
              </Button>
            </div>
          </div>
        )}

        {!error && iframeUrl && (
          <iframe
            src={iframeUrl}
            className="absolute inset-0 w-full h-full border-0"
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            onLoad={handleIframeLoad}
            style={{ opacity: iframeLoaded ? 1 : 0 }}
          />
        )}
      </div>
    </div>,
    document.body,
  )
}
