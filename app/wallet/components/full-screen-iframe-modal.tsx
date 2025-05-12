"use client"

import { X } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { WALLETS } from "@/lib/local-variables"
import { Button } from "@/components/ui/button"

interface IframeResponse {
  iframe_url: string
}

interface FullScreenIframeModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function FullScreenIframeModal({ isOpen, onClose }: FullScreenIframeModalProps) {
  const router = useRouter()
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
        const response = await fetch(WALLETS.cashierUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(WALLETS.defaultParams),
        })

        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`)
        }

        const data: IframeResponse = await response.json()

        if (!data.iframe_url) {
          throw new Error("No iframe URL returned from API")
        }

        setIframeUrl(data.iframe_url)
        setIsLoading(false)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch iframe URL")
        setIsLoading(false)
      }
    }

    fetchIframeUrl()
  }, [isOpen])

  const handleIframeLoad = () => {
    setIframeLoaded(true)
  }

  const handleClose = () => {
    onClose()
    router.push("/wallet")
  }

  if (!isOpen || !mounted) return null

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-background flex flex-col">
      <div className="flex h-16 px-4 py-1 justify-between items-center border-b border-border bg-background z-10">
        <h1 className="text-lg font-bold text-black leading-7">Deposit to P2P</h1>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClose}
          className="flex w-8 h-8 items-center justify-center rounded-full aspect-square overflow-hidden flex-shrink-0 min-w-[2rem] min-h-[2rem] max-w-[2rem] max-h-[2rem] bg-[#EFF3F5] hover:bg-[#EFF3F5] p-0"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 w-full relative">
        {(!iframeLoaded || isLoading) && (
          <div className="absolute inset-0 flex items-center justify-center bg-background z-10">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
              <p className="text-muted-foreground">Loading deposit page...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center justify-center h-full">
            <div className="text-destructive text-center p-4">
              <p className="text-lg font-semibold">Error loading deposit page</p>
              <p className="mt-2">{error}</p>
              <Button
                variant="default"
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
              >
                Try Again
              </Button>
            </div>
          </div>
        )}

        {!error && iframeUrl && (
          <iframe
            src={iframeUrl}
            className="absolute inset-0 w-full h-full border-0"
            title="Deposit to P2P"
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
