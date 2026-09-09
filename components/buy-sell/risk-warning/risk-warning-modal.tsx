"use client"

import { StandaloneCircleExclamationRegularIcon, StandaloneXmarkRegularIcon } from "@deriv/quill-icons/Standalone"

import { Button } from "@/components/ui/button"
import { Dialog, DialogClose, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { isRtlLocale } from "@/lib/i18n/config"
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer"
import { useIsMobile } from "@/lib/hooks/use-is-mobile"
import { useTranslations } from "@/lib/i18n/use-translations"

import {
  HIGH_BLOCK_COUNT_THRESHOLD,
  type RiskWarningResult,
} from "./risk-warning-rules"

interface RiskWarningModalProps {
  isOpen: boolean
  result: RiskWarningResult
  advertiserNickname: string
  onContinue: () => void
  onClose: () => void
}

export default function RiskWarningModal({
  isOpen,
  result,
  advertiserNickname,
  onContinue,
  onClose,
}: RiskWarningModalProps) {
  const isMobile = useIsMobile()
  const { t, locale } = useTranslations()
  const dir = isRtlLocale(locale) ? "rtl" : "ltr"

  if (!isOpen) return null

  const title =
    result.type === "high_block_count"
      ? t("market.riskWarning.highBlockCount.title")
      : t("market.riskWarning.lowCompletion.title")

  const body =
    result.type === "high_block_count"
      ? t("market.riskWarning.highBlockCount.body", {
          threshold: HIGH_BLOCK_COUNT_THRESHOLD,
        })
      : t("market.riskWarning.lowCompletion.body", {
          rate: (result.completionRate ?? 0).toFixed(2),
        })

  const completionRateLabel = result.isBuyAdvert
    ? t("market.riskWarning.buyCompletionRateLabel")
    : t("market.riskWarning.sellCompletionRateLabel")

  const fieldRows = (
    <div className="rounded-xl border p-6 space-y-4">
      <FieldRow
        label={t("market.riskWarning.advertiserLabel")}
        value={advertiserNickname}
      />
      {result.type === "low_completion_rate" && (
        <>
          <FieldRow
            label={completionRateLabel}
            trailing={
              <ValueWithWarningIcon
                text={`${(result.completionRate ?? 0).toFixed(2)}%`}
              />
            }
          />
          <FieldRow
            label={t("market.riskWarning.orderCompletedLabel")}
            value={String(result.orderCount ?? 0)}
          />
        </>
      )}
      {result.type === "high_block_count" && (
        <FieldRow
          label={t("market.riskWarning.blockCountLabel")}
          trailing={
            <ValueWithWarningIcon text={String(result.blockCount ?? 0)} />
          }
        />
      )}
    </div>
  )

  const buttons = (
    <div className="flex flex-col gap-3">
      <Button
        onClick={onContinue}
        variant="destructive"
        className="w-full"
        data-testid="risk-warning-btn-continue"
      >
        {t("market.riskWarning.continueAnyway")}
      </Button>
      <Button
        onClick={onClose}
        variant="outline"
        className="w-full hover:bg-slate-50"
        data-testid="risk-warning-btn-cancel"
      >
        {t("market.riskWarning.goBack")}
      </Button>
    </div>
  )

  const bodyContent = (
    <div className="flex flex-col gap-6">
      <p className="text-grayscale-100 text-base">{body}</p>
      {fieldRows}
      {buttons}
    </div>
  )

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DrawerContent dir={dir} className="px-6 pb-8" data-testid="risk-warning-modal">
          <DrawerTitle className="my-4 text-2xl font-bold text-start">{title}</DrawerTitle>
          {bodyContent}
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent dir={dir} className="p-8 sm:rounded-2xl" data-testid="risk-warning-modal">
        <div className="mb-2 flex items-start justify-between gap-4">
          <DialogTitle className="flex-1 text-start text-2xl font-bold">{title}</DialogTitle>
          <DialogClose
            aria-label={t("market.riskWarning.goBack")}
            className="shrink-0 rounded-full p-2 hover:bg-slate-100 focus:outline-none focus-visible:ring-2"
            data-testid="risk-warning-btn-close"
          >
            <StandaloneXmarkRegularIcon iconSize="xs" />
          </DialogClose>
        </div>
        {bodyContent}
      </DialogContent>
    </Dialog>
  )
}

function FieldRow({
  label,
  value,
  trailing,
}: {
  label: string
  value?: string
  trailing?: React.ReactNode
}) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-grayscale-text-muted text-sm">{label}</span>
      {trailing ?? <span className="text-grayscale-100 text-sm">{value}</span>}
    </div>
  )
}

function ValueWithWarningIcon({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-grayscale-100 text-sm">{text}</span>
      <StandaloneCircleExclamationRegularIcon iconSize="xs" className="text-warning-icon" />
    </div>
  )
}
