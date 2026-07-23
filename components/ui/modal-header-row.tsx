"use client"

import type { ReactNode } from "react"
import Image from "next/image"
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
  closeIconSrc?: string
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
  closeIconSrc = "/icons/close-icon.png",
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
      variant="ghost"
      onClick={onClose}
      className={cn("shrink-0 bg-slate-75 min-w-[48px] px-1", closeButtonClassName)}
      aria-label={closeAriaLabel}
      {...(closeButtonTestId ? { "data-testid": closeButtonTestId } : {})}
    >
      <Image src={closeIconSrc} alt="" width={closeIconSize} height={closeIconSize} />
    </Button>
  )

  const closeControl =
    !hideCloseButton &&
    (asDialog ? <DialogClose asChild>{closeButton}</DialogClose> : closeButton)

  // Matching spacer keeps a centered title optically centered when close is present.
  const leadingSpacer =
    centerTitle && !hideCloseButton ? (
      <div
        className="shrink-0 min-w-[48px]"
        style={{ width: closeIconSize, height: closeIconSize }}
        aria-hidden
      />
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
