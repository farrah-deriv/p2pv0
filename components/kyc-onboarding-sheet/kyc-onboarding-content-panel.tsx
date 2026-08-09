import { Button } from "@/components/ui/button"
import { StandaloneXmarkRegularIcon } from "@deriv/quill-icons/Standalone"
import { cn } from "@/lib/utils"
import { useTranslations } from "@/lib/i18n/use-translations"
import { KycOnboardingChecklist } from "./kyc-onboarding-checklist"
import type { KycOnboardingStep } from "./kyc-onboarding-step-row"

interface KycOnboardingContentPanelProps {
  title: string
  description: string
  steps: KycOnboardingStep[]
  buttonLabel: string
  onButtonClick: () => void
  onClose?: () => void
  statusLabels: {
    verified: string
    inReview: string
    failed: string
    unverified: string
  }
}

export function KycOnboardingContentPanel({
  title,
  description,
  steps,
  buttonLabel,
  onButtonClick,
  onClose,
  statusLabels,
}: KycOnboardingContentPanelProps) {
  const { t } = useTranslations()
  return (
    <div
      className={cn(
        "relative flex min-h-0 flex-1 flex-col bg-background md:w-1/2",
        "flex justify-center px-6 pb-6 pt-6",
        "md:justify-start md:self-stretch md:px-12 md:pb-[7%] md:pt-[13%]",
      )}
      role="region"
      aria-labelledby="kyc-onboarding-title"
    >
      {onClose && (
        <Button
          data-testid="kyc-btn-close"
          onClick={onClose}
          variant="icon-muted"
          className="absolute end-6 top-6 hidden md:inline-flex"
          aria-label={t("common.close")}
        >
          <StandaloneXmarkRegularIcon width={24} height={24} aria-hidden />
        </Button>
      )}

      <div className="flex min-h-0 flex-1 flex-col justify-between gap-8">
        {/* Top: title, description, checklist */}
        <div>
          <h2 id="kyc-onboarding-title" className="text-start text-base font-semibold text-slate-1200 md:text-2xl md:font-bold md:leading-8">
            {title}
          </h2>
          <p className="mt-2 text-base font-normal text-grayscale-600 md:mt-3 md:text-lg md:leading-7">
            {description}
          </p>
          <div className="mt-6 md:mt-8">
            <KycOnboardingChecklist steps={steps} statusLabels={statusLabels} />
          </div>
        </div>

        {/* Bottom: CTA pinned to bottom */}
        <Button data-testid="kyc-btn-primary-cta" className="w-full shrink-0 md:h-12 md:rounded-full" onClick={onButtonClick}>
          {buttonLabel}
        </Button>
      </div>
    </div>
  )
}
