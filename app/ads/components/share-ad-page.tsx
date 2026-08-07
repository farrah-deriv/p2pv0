"use client"

import { useEffect, useMemo, useState, useRef } from "react"
import Image from "next/image"
import { StandaloneXmarkRegularIcon } from "@deriv/quill-icons/Standalone"
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
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`,
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

  const handleSaveImage = async () => {
    if (!cardRef.current) return
    track("ek_save_image_share_ad")

    try {
      await waitForImages(cardRef.current)

      const dataUrl = await htmlToImage.toPng(cardRef.current, {
        quality: 1.0,
        pixelRatio: 2,
        backgroundColor: "#ffffff",
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
      })

      const response = await fetch(dataUrl)
      const blob = await response.blob()

      const file = new File([blob], `deriv-p2p-ad-${ad.id}.png`, {
        type: "image/png",
        lastModified: Date.now(),
      })

      const url = buildAdUrl(ad, window.location.origin)
      const shareText = buildShareAdShareMessage(ad, url, t)
      const sharePayload = { files: [file], text: shareText }

      if (navigator.share && navigator.canShare?.(sharePayload)) {
        await navigator.share(sharePayload)
        track("ek_image_shared_share_ad")
        toast({ description: t("shareAdPage.sharedSuccessfully") })
        return
      }

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text: shareText })
        track("ek_image_shared_share_ad")
        toast({ description: t("shareAdPage.sharedSuccessfully") })
        return
      }

      await handleSaveImage()
    } catch (error) {
      console.log(error)
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
            <StandaloneXmarkRegularIcon width={24} height={24} aria-hidden />
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
                  <Image src="/icons/p2p-logo-white.svg" alt="Deriv P2P" />
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
                <Button
                  variant="ghost"
                  onClick={() => handleShare("whatsapp")}
                  className="flex flex-col items-center gap-2 rounded-lg transition-colors min-w-fit min-h-fit p-0 hover:bg-transparent"
                >
                  <div className="bg-slate-75 p-2 rounded-full flex items-center justify-center">
                    <Image src="/icons/whatsapp.svg" alt="WhatsApp" width={36} height={36} />
                  </div>
                  <span className="text-[10px] font-normal text-slate-1600">WhatsApp</span>
                </Button>

                <Button
                  variant="ghost"
                  onClick={() => handleShare("facebook")}
                  className="flex flex-col items-center gap-2 rounded-lg transition-colors min-w-fit min-h-fit p-0 hover:bg-transparent"
                >
                  <div className="bg-slate-75 p-2 rounded-full flex items-center justify-center">
                    <Image src="/icons/facebook.svg" alt="Facebook" width={36} height={36} />
                  </div>
                  <span className="text-[10px] font-normal text-slate-1600">Facebook</span>
                </Button>

                <Button
                  variant="ghost"
                  onClick={() => handleShare("telegram")}
                  className="flex flex-col items-center gap-2 rounded-lg transition-colors min-w-fit min-h-fit p-0 hover:bg-transparent"
                >
                  <div className="bg-slate-75 p-2 rounded-full flex items-center justify-center">
                    <Image src="/icons/telegram.svg" alt="Telegram" width={36} height={36} />
                  </div>
                  <span className="text-[10px] font-normal text-slate-1600">Telegram</span>
                </Button>

                <Button
                  variant="ghost"
                  onClick={() => handleShare("gmail")}
                  className="flex flex-col items-center gap-2 rounded-lg transition-colors min-w-fit min-h-fit p-0 hover:bg-transparent"
                >
                  <div className="bg-slate-75 p-2 rounded-full flex items-center justify-center">
                    <Image src="/icons/google.svg" alt="Gmail" width={36} height={36} />
                  </div>
                  <span className="text-[10px] font-normal text-slate-1600">Gmail</span>
                </Button>

                <Button
                  variant="ghost"
                  onClick={handleCopyLink}
                  className="flex flex-col items-center gap-2 rounded-lg transition-colors min-w-fit min-h-fit p-0 hover:bg-transparent"
                >
                  <div className="bg-slate-75 p-2 rounded-full flex items-center justify-center">
                    <Image src="/icons/link.svg" alt="link" width={36} height={36} />
                  </div>
                  <span className="text-[10px] font-normal text-slate-1600">{t("shareAdPage.copyLink")}</span>
                </Button>

                <Button
                  variant="ghost"
                  onClick={handleSaveImage}
                  className="flex flex-col items-center gap-2 rounded-lg transition-colors min-w-fit min-h-fit p-0 hover:bg-transparent"
                >
                  <div className="bg-slate-75 p-2 rounded-full flex items-center justify-center">
                    <Image src="/icons/download.svg" alt="download" width={36} height={36} />
                  </div>
                  <span className="text-[10px] font-normal text-slate-1600">{t("shareAdPage.saveImage")}</span>
                </Button>
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
