"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { useTranslations } from "@/lib/i18n/use-translations"
import { useIsMobile } from "@/lib/hooks/use-is-mobile"

const MAX_REVIEW_LENGTH = 500
const ALLOWED_CHARS_RE = new RegExp(`^[\\p{L}\\p{Nd}\\s@.!/%&,_()+:;-]{0,${MAX_REVIEW_LENGTH}}$`, "u")

const FIRST_ROW = [0, 1, 2, 3, 4, 5]
const SECOND_ROW = [6, 7, 8, 9, 10]
const ALL_SCORES = [...FIRST_ROW, ...SECOND_ROW]

interface NpsScoreSelectorProps {
  selectedScore: number | null
  onSelect: (score: number) => void
  isSubmitting: boolean
}

function NpsScoreSelector({ selectedScore, onSelect, isSubmitting }: NpsScoreSelectorProps) {
  const isMobile = useIsMobile()

  const renderButton = (score: number) => (
    <Button
      key={score}
      type="button"
      variant="ghost"
      disabled={isSubmitting}
      data-testid={`feedback-btn-score-${score}`}
      aria-label={`${score} out of 10`}
      onClick={() => onSelect(score)}
      className={cn(
        "!rounded-md !border !text-sm !font-bold !transition-colors !disabled:opacity-50 !justify-center !aspect-square !p-0 !min-w-0",
        isMobile
          ? "min-w-[44px] max-w-[56px] w-[clamp(44px,calc((100vw-88px)/6),56px)]"
          : "flex-1 min-w-[36px] !h-10",
        selectedScore === score
          ? "!bg-primary !text-white !border-primary"
          : "!border-slate-300 !text-slate-700 hover:!border-primary hover:!text-primary hover:!bg-transparent"
      )}
    >
      {String(score)}
    </Button>
  )

  if (isMobile) {
    return (
      <div className="flex flex-col items-center gap-2">
        <div className="flex justify-center gap-2">
          {FIRST_ROW.map(renderButton)}
        </div>
        <div className="flex justify-center gap-2">
          {SECOND_ROW.map(renderButton)}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-nowrap gap-2">
      {ALL_SCORES.map(renderButton)}
    </div>
  )
}

export interface FeedbackSurveyProps {
  onSubmit: (npsScore: number, reviewText: string) => void
  onClose: () => void
  isSubmitting: boolean
}

export function FeedbackSurvey({ onSubmit, onClose, isSubmitting }: FeedbackSurveyProps) {
  const { t } = useTranslations()
  const [selectedScore, setSelectedScore] = useState<number | null>(null)
  const [reviewText, setReviewText] = useState("")
  const [validationError, setValidationError] = useState<string | null>(null)

  const trimmedReview = reviewText.trim()
  const isReviewValid = ALLOWED_CHARS_RE.test(trimmedReview) && trimmedReview.length > 0
  const canSubmit = selectedScore !== null && isReviewValid && !isSubmitting

  const handleReviewChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    if (value.length > MAX_REVIEW_LENGTH) return
    setReviewText(value)
    const trimmed = value.trim()
    if (trimmed.length === 0) {
      setValidationError(null)
    } else if (!ALLOWED_CHARS_RE.test(trimmed)) {
      setValidationError(t("nps.validationError"))
    } else {
      setValidationError(null)
    }
  }

  const handleSubmit = () => {
    if (!canSubmit) return
    onSubmit(selectedScore!, trimmedReview)
  }

  return (
    <div className="flex flex-col">
      <div className="flex-1 px-6 pt-4 pb-4 space-y-6 md:px-8">
        <div className="space-y-4">
          <NpsScoreSelector
            selectedScore={selectedScore}
            onSelect={setSelectedScore}
            isSubmitting={isSubmitting}
          />
          <div className="flex justify-between text-xs text-grayscale-100">
            <span>{t("nps.notLikely")}</span>
            <span>{t("nps.veryLikely")}</span>
          </div>
        </div>

        <div className="space-y-1">
          <Textarea
            data-testid="feedback-input-text"
            placeholder={t("nps.tellUsMore")}
            value={reviewText}
            onChange={handleReviewChange}
            disabled={isSubmitting}
            className="min-h-[100px] resize-none"
            maxLength={MAX_REVIEW_LENGTH}
          />
          {validationError ? (
            <p className="text-xs text-error">{validationError}</p>
          ) : (
            <p data-testid="feedback-text-char-count" className="text-xs text-right text-grayscale-100">
              {reviewText.length}/{MAX_REVIEW_LENGTH}
            </p>
          )}
        </div>
      </div>

      <div className="px-6 pb-6 space-y-2 md:px-8">
        <Button data-testid="feedback-btn-submit" onClick={handleSubmit} disabled={!canSubmit} className="w-full">
          {isSubmitting ? (
            <Spinner size="xs" />
          ) : (
            t("nps.sendFeedback")
          )}
        </Button>
        <Button
          data-testid="feedback-btn-later"
          variant="secondary-outline"
          onClick={onClose}
          disabled={isSubmitting}
          className="w-full disabled:opacity-50"
        >
          {t("nps.askMeLater")}
        </Button>
      </div>
    </div>
  )
}
