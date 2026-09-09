"use client"

import { StandaloneXmarkRegularIcon } from "@deriv/quill-icons/Standalone"
import { Button } from "@/components/ui/button"
import { useTranslations } from "@/lib/i18n/use-translations"
import {
  getPaymentMethodSelectionChipLabel,
  getPaymentMethodSelectionLines,
  normalizePaymentMethodId,
} from "@/lib/payment-methods/payment-method-selection-utils"

type SelectablePaymentMethod = {
  id: string | number
  display_name: string
  type?: string
  method?: string
  fields?: Record<string, unknown>
}

/**
 * Non-sticky selected chips block that scrolls with the payment-method list.
 * Spacing mirrors mobile SelectSellPaymentMethodSheet (8px chip gap, 16px around divider).
 */
export function SelectedPaymentMethodsSection({
  methods,
  selectedIds,
  onRemove,
}: {
  methods: SelectablePaymentMethod[]
  selectedIds: (string | number)[]
  onRemove: (methodId: string) => void
}) {
  const { t } = useTranslations()
  const byId = new Map(
    methods.map((method) => [normalizePaymentMethodId(method.id), method] as const),
  )
  const selected = selectedIds
    .map((id) => byId.get(normalizePaymentMethodId(id)))
    .filter((method): method is SelectablePaymentMethod => method != null)

  if (selected.length === 0) return null

  return (
    <div
      className="flex flex-col"
      data-testid="selected-payment-methods-section"
    >
      <p className="text-base leading-6 text-slate-1200">
        {t("paymentMethod.selectedPaymentMethod")}
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {selected.map((method) => {
          const methodId = normalizePaymentMethodId(method.id)
          const lines = getPaymentMethodSelectionLines(method, t)
          const label = getPaymentMethodSelectionChipLabel(method, t)
          return (
            <Button
              key={methodId}
              type="button"
              variant="secondary-outline"
              size="xs"
              className="!h-auto inline-flex max-w-full items-center gap-1.5 !rounded-md !px-3 !py-1.5 text-start !text-xs !font-normal !leading-4"
              onClick={(event) => {
                event.stopPropagation()
                onRemove(methodId)
              }}
              data-testid={`selected-payment-method-chip-${methodId}`}
              aria-label={`${t("common.remove")}: ${label}`}
            >
              <span className="flex min-w-0 max-w-full items-center gap-1.5">
                <span className="min-w-0 truncate">
                  <span className="text-slate-1200">{lines.title}</span>
                  {lines.subtitle ? (
                    <span className="text-grayscale-text-muted">{` ${lines.subtitle}`}</span>
                  ) : null}
                </span>
                <StandaloneXmarkRegularIcon width={16} height={16} className="size-4 shrink-0 opacity-72" aria-hidden />
              </span>
            </Button>
          )
        })}
      </div>
      {/* Mobile: QuillSpacing.md (16) above + below divider */}
      <div className="mt-4 mb-4 border-b border-grayscale-400" />
    </div>
  )
}
