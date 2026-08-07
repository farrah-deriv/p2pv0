"use client"

import { useState } from "react"
import {
  StandaloneXmarkRegularIcon,
  StandaloneStarFillIcon,
  StandaloneThumbsUpRegularIcon,
  StandaloneThumbsDownRegularIcon,
} from "@deriv/quill-icons"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"
import type { RatingSidebarProps, RatingData } from "./types"

export function RatingSidebar({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting = false,
  title = "Rate and recommend",
  ratingLabel = "How would you rate this transaction?",
  recommendLabel = "Would you recommend this seller?",
}: RatingSidebarProps) {
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [recommend, setRecommend] = useState<boolean | null>(null)

  const handleSubmit = async () => {
    if (rating === 0) {
      toast({
        title: "Rating required",
        description: "Please select a star rating before submitting.",
        variant: "destructive",
      })
      return
    }

    const ratingData: RatingData = {
      rating,
      recommend,
    }

    try {
      await onSubmit(ratingData)
      // Reset form after successful submission
      setRating(0)
      setHoverRating(0)
      setRecommend(null)
    } catch (error) {
      // Error handling is done in the parent component
      console.error("Error submitting rating:", error)
    }
  }

  const handleClose = () => {
    // Reset form when closing
    setRating(0)
    setHoverRating(0)
    setRecommend(null)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-end z-50">
      <div className="bg-white w-full max-w-md h-full flex flex-col">
       <div className="flex justify-between items-center px-4 py-1 border-b">
          <h2 className="text-xl font-bold">{title}</h2>
          <Button onClick={handleClose} variant="ghost" size="icon" className="p-1">
            <StandaloneXmarkRegularIcon iconSize="sm" />
          </Button>
        </div>

        <div className="flex-1 overflow-auto p-4">
          <div className="space-y-6">
            {/* Star Rating */}
            <div className="space-y-4">
              <h3 className="text-sm text-grayscale-100">{ratingLabel}</h3>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Button
                  variant="ghost"
                  size="sm"
                    key={star}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    disabled={isSubmitting}
                  >
                    <StandaloneStarFillIcon
                      iconSize="sm"
                      className={cn((hoverRating || rating) >= star ? "text-yellow-400" : "text-gray-300")}
                    />
                  </Button>
                ))}
              </div>
            </div>

            {/* Recommendation */}
            <div className="space-y-4">
              <h3 className="text-sm text-grayscale-100">{recommendLabel}</h3>
              <div className="flex gap-4">
                <Button
                  variant={recommend ? "black" : "outline"}
                  size="sm"
                  onClick={() => setRecommend(true)}
                  disabled={isSubmitting}
                >
                  <StandaloneThumbsUpRegularIcon iconSize="sm" className={cn(recommend === true ? "text-green-500" : "text-gray-400")} />
                  <span className="text-sm text-grayscale-100">Yes</span>
                </Button>
                <Button
                  variant={recommend ? "outline" : "black"}
                  size="sm"
                  onClick={() => setRecommend(false)}
                  disabled={isSubmitting}
                >
                  <StandaloneThumbsDownRegularIcon iconSize="sm" className={cn(recommend === false ? "text-red-500" : "text-gray-400")} />
                  <span className="text-sm text-grayscale-100">No</span>
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-t">
          <Button variant="black" onClick={handleSubmit} disabled={isSubmitting || rating === 0} className="w-full">
            {isSubmitting ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent me-2"></div>
                Submitting...
              </>
            ) : (
              "Submit"
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
