"use client"

import { useEffect, useMemo, useState, useRef } from "react"
import Image from "next/image"
import { ButtonIcon } from "@deriv-com/quill-ui-v2"
import { StandaloneXmarkBoldIcon } from "@deriv/quill-icons/Standalone"
import QRCode from "qrcode"
import * as htmlToImage from "html-to-image"
import type { Ad } from "@/types"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { useIsMobile } from "@/hooks/use-mobile"
import { useTranslations } from "@/lib/i18n/use-translations"
import { useTrackers } from "@/analytics/useTrackers"
import {
  buildAdUrl,
  buildShareAdRateValue,
  buildShareAdShareMessage,
  buildShareAdTelegramMessage,
} from "@/lib/share-ad-utils"
import { TOAST_SUCCESS_CLASS } from "@/lib/toast-utils"

interface ShareAdPageProps {
  ad: Ad
  onClose: () => void
}

const successToastClassName =
  TOAST_SUCCESS_CLASS

export default function ShareAdPage({ ad, onClose }: ShareAdPageProps) {
  const { t } = useTranslations()
  const { track } = useTrackers()
  const { toast } = useToast()
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const cardRef = useRef<HTMLDivElement>(null)
  const isMobile = useIsMobile()

  const adUrl = useMemo(
    () =>
      typeof window !== "undefined"
        ? buildAdUrl(ad, window.location.origin)
        : "",
    [ad],
  )

  useEffect(() => {
    const generateQRCode = async () => {
      try {
        setIsLoading(true)
        const url = buildAdUrl(ad, window.location.origin)
        const qrCode = await QRCode.toDataURL(url, {
          width: 200,
          margin: 2,
          color: {
            dark: "#000000",
            light: "#FFFFFF",
          },
        })
        setQrCodeUrl(qrCode)
      } catch (error) {
        toast({
          description: t("shareAdPage.failedToGenerateQR"),
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    generateQRCode()
  }, [ad, toast, t])

  const showCopySuccessToast = () => {
    toast({
      description: (
        <div className="flex items-center gap-2">
          <Image src="/icons/tick.svg" alt="Success" width={24} height={24} />
          <span>{t("shareAdPage.adLinkCopied")}</span>
        </div>
      ),
      className: successToastClassName,
      duration: 2500,
    })
  }

  const showSaveSuccessToast = () => {
    toast({
      description: (
        <div className="flex items-center gap-2">
          <Image src="/icons/tick.svg" alt="Success" width={24} height={24} />
          <span>{t("shareAdPage.imageSavedSuccessfully")}</span>
        </div>
      ),
      className: successToastClassName,
      duration: 2500,
    })
  }

  const handleShare = async (platform: string) => {
    track("ek_share_methods_share_ad", { method_name: platform })
    const url = buildAdUrl(ad, window.location.origin)
    const text = buildShareAdShareMessage(ad, url, t)
    const telegramText = buildShareAdTelegramMessage(ad, t)

    const shareUrls: Record<string, string> = {
      whatsapp: `https://wa.me/?text=${encodeURIComponent(`${text}`)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`${url}`)}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(telegramText)}`,
      twitter: `https://x.com/intent/tweet?text=${encodeURIComponent(text)}`,
      gmail: `https://mail.google.com/mail/?view=cm&fs=1&body=${encodeURIComponent(`${text}`)}`,
    }

    if (shareUrls[platform]) {
      window.open(shareUrls[platform], "_blank")
    }
  }

  const handleCopyLink = async () => {
    const url = buildAdUrl(ad, window.location.origin)
    try {
      await navigator.clipboard.writeText(url)
      showCopySuccessToast()
    } catch (error) {
      toast({
        description: t("shareAdPage.failedToCopyLink"),
        variant: "destructive",
      })
    }
  }

  const getEmbeddedFontCSS = (): string =>
    Array.from(document.styleSheets)
      .flatMap((sheet) => {
        try {
          return Array.from(sheet.cssRules)
        } catch {
          return []
        }
      })
      .filter((rule) => rule instanceof CSSFontFaceRule)
      .map((rule) => rule.cssText)
      .join("\n")

  const handleSaveImage = async () => {
    if (!cardRef.current) return
    track("ek_save_image_share_ad")

    try {
      await waitForImages(cardRef.current)

      const dataUrl = await htmlToImage.toPng(cardRef.current, {
        quality: 1.0,
        pixelRatio: 2,
        backgroundColor: "#ffffff",
        fontEmbedCSS: getEmbeddedFontCSS(),
      })

      const link = document.createElement("a")
      link.href = dataUrl
      link.download = `deriv-p2p-ad-${ad.id}.png`

      link.style.display = "none"
      document.body.appendChild(link)
      link.click()
      track("ek_image_saved_share_ad")

      setTimeout(() => {
        document.body.removeChild(link)
      }, 100)

      showSaveSuccessToast()
    } catch (error) {
      toast({
        description: t("shareAdPage.failedToSaveImage"),
        variant: "destructive",
      })
    }
  }

  const waitForImages = (element: HTMLElement) => {
    return Promise.all(
      Array.from(element.querySelectorAll("img")).map((img) => {
        if (img.complete) return Promise.resolve()
        return new Promise<void>((resolve) => {
          img.onload = img.onerror = () => resolve()
        })
      }),
    )
  }

  const handleShareImage = async () => {
    if (!cardRef.current) return
    track("ek_share_image_share_ad")

    await new Promise((r) => setTimeout(r, 300))
    await waitForImages(cardRef.current)

    try {
      const dataUrl = await htmlToImage.toPng(cardRef.current, {
        quality: 0.95,
        pixelRatio: isMobile ? 2 : 3,
        backgroundColor: "#ffffff",
        fontEmbedCSS: getEmbeddedFontCSS(),
      })

      const [header, base64] = dataUrl.split(",")
      const mimeMatch = header.match(/:(.*?);/)
      const mime = mimeMatch ? mimeMatch[1] : "image/png"
      const binary = atob(base64)
      const bytes = new Uint8Array(binary.length)
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
      const blob = new Blob([bytes], { type: mime })

      const file = new File([blob], `deriv-p2p-ad-${ad.id}.png`, {
        type: "image/png",
        lastModified: Date.now(),
      })

      const url = buildAdUrl(ad, window.location.origin)
      const shareText = buildShareAdShareMessage(ad, url, t)
      const sharePayload = { files: [file], text: shareText }

      if (navigator.share && navigator.canShare?.(sharePayload)) {
        await navigator.share(sharePayload)
      } else if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text: shareText })
      } else {
        toast({ description: t("shareAdPage.sharingNotSupported"), variant: "destructive" })
        return
      }

      track("ek_image_shared_share_ad")
      toast({ description: t("shareAdPage.sharedSuccessfully") })
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return
      console.error(error)
      toast({ description: t("shareAdPage.failedToSaveImage"), variant: "destructive" })
    }
  }

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <Spinner size="lg" />
        <p className="mt-2 text-slate-600">{t("myAds.loadingAds")}</p>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-white">
      <div className="mx-auto flex min-h-full max-w-xl flex-col px-4 pb-6 md:px-0">
        <div className="flex items-center justify-end py-[12px] md:p-6 md:pb-4">
          <Button onClick={() => { track("ek_close_share_ad"); onClose() }} variant="icon-muted" aria-label={t("common.close")}>
            <StandaloneXmarkBoldIcon width={24} height={24} aria-hidden />
          </Button>
        </div>
        <h2 className="text-[24px] font-bold md:px-0">{t("shareAdPage.shareAdTitle")}</h2>
        <div className="flex flex-col items-center space-y-6 py-6 md:px-0">
          <div
            ref={cardRef}
            className="w-full md:w-[358px] bg-share-card-gradient py-4 md:py-6 px-6 md:px-8 text-white"
          >
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                <Image src="/icons/p2p-logo-white.svg" alt="Deriv P2P" width={100} height={24} />
              </div>
              <div className="text-lg font-bold">
                {ad.type === "buy" ? t("common.sell") : t("common.buy")} {ad.account_currency}
              </div>
            </div>

            <div className="mb-4 grid grid-cols-[max-content_1fr] gap-x-8 gap-y-1 md:grid-cols-[85px_1fr] md:gap-x-6">
              <span className="whitespace-nowrap text-sm font-medium md:font-normal">
                {t("shareAdPage.idNumber")}
              </span>
              <span className="text-start text-base font-bold md:text-sm">{ad.id}</span>
              <span className="whitespace-nowrap text-sm font-medium md:font-normal">
                {t("shareAdPage.limits")}
              </span>
              <span className="text-start text-base font-bold md:text-sm">
                {ad.limits && typeof ad.limits === "object"
                  ? `${ad.limits.min} - ${ad.limits.max} ${ad.limits.currency}`
                  : ad.limits}
              </span>
              <span className="whitespace-nowrap text-sm font-medium md:font-normal">
                {t("shareAdPage.rate")}
              </span>
              <span className="text-start text-base font-bold md:text-sm">
                {buildShareAdRateValue(ad)}
              </span>
            </div>

            {qrCodeUrl && (
              <>
                <div className="bg-white rounded-lg p-2 flex flex-col items-center w-fit mx-auto">
                  <img src={qrCodeUrl || "/placeholder.svg"} alt="QR Code" width={110} height={110} />
                </div>
                <p className="text-grayscale-text-muted text-xs mt-3 text-center">{t("shareAdPage.qrCodeDescription")}</p>
              </>
            )}
          </div>

          {isMobile && adUrl && (
            <div className="w-full space-y-2">
              <p className="text-sm text-start">{t("shareAdPage.adLinkLabel")}</p>
              <div className="flex items-center gap-2 rounded-lg border border-grayscale-400 py-2 ps-4 pe-2">
                <p className="min-w-0 flex-1 truncate text-sm text-start">{adUrl}</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="shrink-0"
                  onClick={handleCopyLink}
                >
                  {t("shareAdPage.copyButton")}
                </Button>
              </div>
            </div>
          )}

          {!isMobile && (
            <div className="flex gap-6">
              {[
                { label: "WhatsApp", icon: "/icons/whatsapp.svg", onClick: () => handleShare("whatsapp") },
                { label: "Facebook", icon: "/icons/facebook.svg", onClick: () => handleShare("facebook") },
                { label: "Telegram", icon: "/icons/telegram.svg", onClick: () => handleShare("telegram") },
                { label: "Gmail", icon: "/icons/google.svg", onClick: () => handleShare("gmail") },
                { label: t("shareAdPage.copyLink"), icon: "/icons/link.svg", onClick: handleCopyLink },
                { label: t("shareAdPage.saveImage"), icon: "/icons/download.svg", onClick: handleSaveImage },
              ].map(({ label, icon, onClick }) => (
                <div key={label} className="flex flex-col items-center gap-2">
                  <ButtonIcon
                    type="secondary"
                    size="lg"
                    icon={<Image src={icon} alt="" width={36} height={36} aria-hidden />}
                    onClick={onClick}
                    aria-label={label}
                    className="!bg-neutral-50 !border-0"
                  />
                  <span className="text-[10px] font-normal text-slate-1600" aria-hidden>{label}</span>
                </div>
              ))}
            </div>
          )}

          {isMobile && (
            <div className="flex w-full flex-col gap-2">
              <Button className="h-12 w-full" onClick={handleShareImage}>
                {t("shareAdPage.shareImage")}
              </Button>
              <Button className="h-12 w-full" variant="outline" onClick={handleSaveImage}>
                {t("shareAdPage.saveImage")}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
