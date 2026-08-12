"use client"

import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"
import { OrdersAPI } from "@/services/api"
import { useTranslations } from "@/lib/i18n/use-translations"
import { useAlertDialog } from "@/hooks/use-alert-dialog"
import type { RatingSidebarProps, RatingData } from "./types"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { useIsMobile } from "@/components/ui/use-mobile"

interface RatingContentProps {
  rating: number
  setRating: (rating: number) => void
  hoverRating: number
  setHoverRating: (rating: number) => void
  recommend: boolean | null
  setRecommend: (recommend: boolean | null) => void
  ratingLabel: string
  recommendLabel?: string
  onSubmit: () => void
  isSubmitting: boolean
  t: (key: string) => string
}

const RatingContent = ({
  rating,
  setRating,
  hoverRating,
  setHoverRating,
  recommend,
  setRecommend,
  ratingLabel,
  recommendLabel,
  onSubmit,
  isSubmitting,
  t,
}: RatingContentProps) => (
  <>
    <div className="flex-1 overflow-auto p-4 md:px-0">
      <div className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-sm">{ratingLabel}</h3>
          <div className="flex">
            {[1, 2, 3, 4, 5].map((star) => (
              <Button
                variant="ghost"
                size="sm"
                key={star}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="hover:!bg-transparent !p-0 !min-w-0 me-1"
                data-testid={`rating-btn-star-${star}`}
              >
                <Image
                  src={(hoverRating || rating) >= star ? "/icons/star-active.png" : "/icons/star-custom.png"}
                  alt={t("common.rating")}
                  width={32}
                  height={32}
                />
              </Button>
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <h3 className="text-sm">{recommendLabel}</h3>
          <div className="flex gap-4">
            <Button
              variant="outline"
              className={cn(recommend === true ? "!bg-success-text hover:!bg-success-text" : "")}
              size="sm"
              onClick={() => setRecommend(recommend === true ? null : true)}
              data-testid="rating-btn-recommend-yes"
            >
              <Image
                src={recommend === true ? "/icons/thumbs-up-white.png" : "/icons/thumbs-up-custom.png"}
                alt={t("common.recommended")}
                width={14}
                height={14}
              />
              <span
                className={cn(
                  "text-sm ms-[8px] font-normal ",
                  recommend === true ? "text-white" : "text-grayscale-100",
                )}
              >
                {t("ratingSidebar.yes")}
              </span>
            </Button>
            <Button
              variant="outline"
              className={cn(recommend === false ? "!bg-disputed-icon hover:!bg-disputed-icon" : "")}
              size="sm"
              onClick={() => setRecommend(recommend === false ? null : false)}
              data-testid="rating-btn-recommend-no"
            >
              <Image
                src={recommend === false ? "/icons/thumbs-down-white.png" : "/icons/thumbs-down-custom.png"}
                alt={t("common.thumbsDown")}
                width={14}
                height={14}
              />
              <span
                className={cn(
                  "text-sm ms-[8px] font-normal ",
                  recommend === false ? "text-white" : "text-grayscale-100",
                )}
              >
                {t("ratingSidebar.no")}
              </span>
            </Button>
          </div>
        </div>
      </div>
    </div>
    <div className="px-4 md:px-0">
      <Button onClick={onSubmit} disabled={rating === 0 || isSubmitting} className="w-full" data-testid="rating-btn-submit">
        {isSubmitting ? (
          <Spinner size="xs" />
        ) : (
          t("ratingSidebar.submit")
        )}
      </Button>
    </div>
  </>
)

export function RatingSidebar({
  isOpen,
  onClose,
  onSubmit,
  orderId,
  title,
  ratingLabel,
  recommendLabel,
}: RatingSidebarProps) {
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [recommend, setRecommend] = useState<boolean | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  const isMobile = useIsMobile()
  const { t } = useTranslations()
  const { showAlert } = useAlertDialog()

  const handleSubmit = async () => {
    if (rating === 0) {
      toast({
        title: t("ratingSidebar.ratingRequiredTitle"),
        description: t("ratingSidebar.ratingRequiredDescription"),
        variant: "destructive",
      })
      return
    }

    const ratingData: RatingData = {
      rating,
      recommend,
    }

    try {
      setIsSubmitting(true)
      const result = await OrdersAPI.reviewOrder(orderId, ratingData)
      if (result.errors.length === 0) {
        onSubmit?.()
      }
      setRating(0)
      setHoverRating(0)
      setRecommend(null)
    } catch (error) {
      const errorCode = error instanceof Error ? error.message : "UnknownError"
      if (errorCode === "OrderTempLocked") {
        showAlert({
          title: t("order.tempLockedTitle"),
          description: t("order.tempLockedDescription"),
          confirmText: t("order.tryAgain"),
          cancelText: t("order.goBack"),
          type: "warning",
          onCancel: () => handleClose(),
        })
      } else {
        setApiError(error instanceof Error ? error.message : "An error occurred. Please try again.")
        console.error("Error submitting rating:", error)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setRating(0)
    setHoverRating(0)
    setRecommend(null)
    setApiError(null)
    onClose()
  }

  if (!isOpen) return null

  const displayTitle = t("ratingSidebar.title") || title
  const displayRatingLabel = t("ratingSidebar.ratingLabel") || ratingLabel
  const displayRecommendLabel = t("ratingSidebar.recommendLabel") || recommendLabel

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={onClose}>
        <DrawerContent className="h-auto max-h-[80vh] rounded-t-2xl px-0" data-testid="rating-sidebar-container">
          <DrawerHeader className="pb-4">
            <DrawerTitle className="text-xl font-bold text-center">{displayTitle}</DrawerTitle>
          </DrawerHeader>
          {apiError && <p className="text-error text-xs px-4 pb-2" data-testid="rating-error-api">{apiError}</p>}
          <RatingContent
            rating={rating}
            setRating={setRating}
            hoverRating={hoverRating}
            setHoverRating={setHoverRating}
            recommend={recommend}
            setRecommend={setRecommend}
            ratingLabel={displayRatingLabel}
            recommendLabel={displayRecommendLabel}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            t={t}
          />
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md sm:rounded-[32px]" data-testid="rating-sidebar-container">
        <DialogHeader>
          <DialogTitle className="tracking-normal font-bold text-2xl">{displayTitle}</DialogTitle>
        </DialogHeader>
        {apiError && <p className="text-error text-xs" data-testid="rating-error-api">{apiError}</p>}
        <RatingContent
          rating={rating}
          setRating={setRating}
          hoverRating={hoverRating}
          setHoverRating={setHoverRating}
          recommend={recommend}
          setRecommend={setRecommend}
          ratingLabel={displayRatingLabel}
          recommendLabel={displayRecommendLabel}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          t={t}
        />
      </DialogContent>
    </Dialog>
  )
}
