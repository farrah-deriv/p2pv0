"use client"

import type { ReactNode } from "react"
import { StandaloneXmarkRegularIcon } from "@deriv/quill-icons/Standalone"
import { Button } from "@/components/ui/button"
import { DialogClose, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

type ModalHeaderRowProps = {
  title: ReactNode
  onClose?: () => void
  hideCloseButton?: boolean
  className?: string
  titleClassName?: string
  closeButtonClassName?: string
  /** Localized label for the close button (e.g. `t("common.close")`). */
  closeAriaLabel: string
  /** Use Radix DialogTitle + DialogClose for accessible dialogs */
  asDialog?: boolean
  closeIconSize?: number
  closeButtonTestId?: string
  /**
   * Center title in the header row. Adds a leading spacer matching the close
   * control so the label is viewport-centered, not offset by the close button.
   */
  centerTitle?: boolean
}

/**
 * Title + close on opposite ends; respects document `dir` (title at start, close at end).
 */
export function ModalHeaderRow({
  title,
  onClose,
  hideCloseButton = false,
  className,
  titleClassName,
  closeButtonClassName,
  closeAriaLabel,
  asDialog = false,
  closeIconSize = 24,
  closeButtonTestId,
  centerTitle = false,
}: ModalHeaderRowProps) {
  const titleClasses = cn(
    "min-w-0 flex-1 font-bold text-2xl text-slate-1200",
    centerTitle ? "text-center" : "text-start",
    titleClassName,
  )

  const closeButton = (
    <Button
      type="button"
      variant="icon-muted"
      onClick={onClose}
      className={cn("shrink-0", closeButtonClassName)}
      aria-label={closeAriaLabel}
      {...(closeButtonTestId ? { "data-testid": closeButtonTestId } : {})}
    >
      <StandaloneXmarkRegularIcon width={closeIconSize} height={closeIconSize} aria-hidden />
    </Button>
  )

  const closeControl =
    !hideCloseButton &&
    (asDialog ? <DialogClose asChild>{closeButton}</DialogClose> : closeButton)

  // Matching spacer keeps a centered title optically centered when close is present.
  const leadingSpacer =
    centerTitle && !hideCloseButton ? (
      <div className="shrink-0 h-8 w-8" aria-hidden />
    ) : null

  return (
    <div className={cn("flex items-center justify-between gap-4", className)}>
      {leadingSpacer}
      {asDialog ? (
        <DialogTitle className={titleClasses}>{title}</DialogTitle>
      ) : (
        <div className={titleClasses}>{title}</div>
      )}
      {closeControl}
    </div>
  )
}
