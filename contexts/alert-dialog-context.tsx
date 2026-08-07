"use client"

import type React from "react"
import { createContext, useContext, useState, useCallback, useEffect } from "react"
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Drawer, DrawerContent } from "@/components/ui/drawer"
import type { AlertDialogConfig, AlertDialogContextType } from "@/types/alert-dialog"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { StandaloneXmarkRegularIcon } from "@deriv/quill-icons/Standalone"
import { useIsMobile } from "@/lib/hooks/use-is-mobile"
import { isRtlLocale } from "@/lib/i18n/config"
import { useTranslations } from "@/lib/i18n/use-translations"

const AlertDialogContext = createContext<AlertDialogContextType | undefined>(undefined)

interface AlertDialogProviderProps {
  children: React.ReactNode
}

export function AlertDialogProvider({ children }: AlertDialogProviderProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [config, setConfig] = useState<AlertDialogConfig>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isMobile = useIsMobile()
  const { t, locale } = useTranslations()
  const dir = isRtlLocale(locale) ? "rtl" : "ltr"

  const showAlert = useCallback((alertConfig: AlertDialogConfig) => {
    setConfig(alertConfig)
    setIsOpen(true)
  }, [])

  const hideAlert = useCallback(() => {
    setIsOpen(false)
    setConfig({})
  }, [])

  const handleConfirm = useCallback(async () => {
    if (config.onConfirm) {
      setIsSubmitting(true)
      try {
        await config.onConfirm()
      } finally {
        setIsSubmitting(false)
      }
    }
    hideAlert()
  }, [config.onConfirm, hideAlert])

  const handleCancel = useCallback(() => {
    if (config.onCancel) {
      config.onCancel()
    }
    hideAlert()
  }, [config.onCancel, hideAlert])

  const handleClose = useCallback(() => {
    if (config.onClose) {
      config.onClose()
    }
    hideAlert()
  }, [config.onClose, hideAlert])

  const handleOpenChange = useCallback((open: boolean) => {
    if (!open && config.preventOutsideClose) return

    if (open) {
      setIsOpen(true)
      return
    }

    hideAlert()
    config.onClose?.()
  }, [config.onClose, config.preventOutsideClose, hideAlert])

  const contextValue: AlertDialogContextType = {
    showAlert,
    hideAlert,
    isOpen,
  }

  // vaul (mobile Drawer) uses react-dialog@1.1.19 → dismissable-layer@1.1.15, while
  // DropdownMenu uses dismissable-layer@1.1.16. These are separate module instances with
  // separate originalBodyPointerEvents variables. ReactDOM.flushSync in dispatchDiscreteCustomEvent
  // forces the Drawer's DismissableLayer (v1.1.15) to run setup while body is already
  // pointer-events:none from the DropdownMenu (v1.1.16), so it saves 'none' as the original.
  // When the Drawer closes, it "restores" body to 'none'. We clear it here in the setup phase,
  // which runs after all passive-effect cleanups (including the DismissableLayer restore).
  useEffect(() => {
    if (!isOpen) {
      document.body.style.removeProperty('pointer-events')
    }
  }, [isOpen])

  const isKycOnboarding = config.size === "kycOnboarding"

  const renderDesktopContent = () => {
    if (isKycOnboarding && config.content) {
      return (
        <div
          className={cn(
            "max-h-[90vh] overflow-y-auto md:max-h-none md:overflow-hidden",
            config.contentClassName,
          )}
        >
          {config.content}
        </div>
      )
    }

    if (config.content) {
      return (
        <div className="flex min-w-0 w-full flex-col overflow-hidden">
          <div className="mb-4 flex shrink-0 items-start justify-between gap-3 px-8 pt-6">
            {config.title && <h2 className="min-w-0 flex-1 text-start text-2xl leading-8 font-extrabold text-slate-1200">{config.title}</h2>}
            {!config.hideCloseButton && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleClose}
                aria-label={t("common.close")}
                className="shrink-0 size-10 min-h-10 min-w-10 rounded-full bg-black/4 hover:bg-black/8 focus-visible:ring-1 focus-visible:ring-black"
              >
                <StandaloneXmarkRegularIcon width={20} height={20} aria-hidden />
              </Button>
            )}
          </div>
          <div
            className={cn(
              "flex min-h-0 min-w-0 w-full max-w-full flex-col overflow-hidden px-8 pb-6 max-h-[60vh]",
              config.contentClassName,
            )}
          >
            {config.content}
          </div>
          {(config.type || config.cancelText) && (
            <div className="flex flex-col gap-2 px-8 py-4 border-t border-grayscale-500">
              {config.type && (
                <Button onClick={handleConfirm} disabled={isSubmitting} variant="primary" className="w-full">
                  {config.confirmText || t("common.continue")}
                </Button>
              )}
              {config.cancelText && (
                <Button onClick={handleCancel} variant={config.type ? "outline" : "primary"} className="w-full">
                  {config.cancelText}
                </Button>
              )}
            </div>
          )}
        </div>
      )
    }

    return (
      <div className="flex flex-col gap-8 p-8 overflow-y-auto" data-testid={config.testId}>
        <div className="flex flex-col gap-4">
          <div className="flex items-start justify-between gap-3">
            {config.title && (
              <h2 className="text-2xl leading-8 font-extrabold text-slate-1200">{config.title}</h2>
            )}
            {!config.hideCloseButton && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleClose}
                aria-label={t("common.close")}
                className="shrink-0 size-10 min-h-10 min-w-10 rounded-full bg-black/4 hover:bg-black/8 focus-visible:ring-1 focus-visible:ring-black"
              >
                <StandaloneXmarkRegularIcon width={20} height={20} aria-hidden />
              </Button>
            )}
          </div>
          {config.description && (
            <p className="text-base leading-6 font-normal text-black/72">{config.description}</p>
          )}
        </div>
        {(config.cancelText || config.type) && (
          <div className="flex flex-col gap-2">
            {config.type && (
              <Button onClick={handleConfirm} disabled={isSubmitting} variant="primary" className="w-full" data-testid={config.confirmTestId}>
                {config.confirmText || t("common.continue")}
              </Button>
            )}
            {config.cancelText && (
              <Button onClick={handleCancel} variant={config.type ? "outline" : "primary"} className="w-full" data-testid={config.cancelTestId}>
                {config.cancelText}
              </Button>
            )}
          </div>
        )}
      </div>
    )
  }

  const renderMobileContent = () => {
    if (isKycOnboarding && config.content) {
      return (
        <div
          className={cn(
            "flex flex-1 flex-col overflow-hidden",
            config.contentClassName,
          )}
        >
          {config.content}
        </div>
      )
    }

    if (config.content) {
      return (
        <div
          className={cn(
            "flex flex-col max-h-[80vh] overflow-hidden",
            config.mobileSheetFullHeight && "h-full min-h-0 max-h-none",
          )}
        >
          {config.title && (
            <h2
              className={cn(
                "mb-2 px-6 pt-6 text-2xl leading-8 font-extrabold text-slate-1200 flex-shrink-0",
                config.titleAlign === "center" ? "text-center" : "text-start",
              )}
            >
              {config.title}
            </h2>
          )}
          <div
            className={cn(
              "px-6 flex-1 min-h-0 flex flex-col overflow-hidden",
              config.mobileContentClassName ?? config.contentClassName,
            )}
          >
            {config.content}
          </div>
          {(config.type || config.cancelText) && (
            <div className="flex flex-col gap-2 px-6 py-4 flex-shrink-0 border-t border-grayscale-500">
              {config.type && (
                <Button onClick={handleConfirm} disabled={isSubmitting} variant="primary" className="w-full">
                  {config.confirmText || t("common.continue")}
                </Button>
              )}
              {config.cancelText && (
                <Button onClick={handleCancel} variant={config.type ? "outline" : "primary"} className="w-full">
                  {config.cancelText}
                </Button>
              )}
            </div>
          )}
        </div>
      )
    }

    return (
      <div className="flex flex-col gap-8 p-6 overflow-y-auto" data-testid={config.testId}>
        <div className="flex flex-col gap-4">
          {config.title && <h2 className="text-2xl leading-8 font-extrabold text-slate-1200">{config.title}</h2>}
          {config.description && <p className="text-base leading-6 font-normal text-black/72">{config.description}</p>}
        </div>
        {(config.cancelText || config.type) && (<div className="flex flex-col gap-2">
          {config.type && (
            <Button onClick={handleConfirm} disabled={isSubmitting} variant="primary" className="w-full" data-testid={config.confirmTestId}>
              {config.confirmText || t("common.continue")}
            </Button>
          )}
          {config.cancelText && (
            <Button onClick={handleCancel} variant={config.type ? "outline" : "primary"} className="w-full" data-testid={config.cancelTestId}>
              {config.cancelText}
            </Button>
          )}
        </div>)}
      </div>
    )
  }

  return (
    <AlertDialogContext.Provider value={contextValue}>
      {children}

      {isMobile ? (
        <Drawer open={isOpen} onOpenChange={handleOpenChange}>
          <DrawerContent
            dir={dir}
            hideHandle={isKycOnboarding}
            className={cn(
              "p-0",
              isKycOnboarding
                ? "max-h-[95vh] overflow-hidden rounded-t-2xl border-0"
                : "rounded-t-[16px]",
              config.mobileSheetClassName,
            )}
          >
            {renderMobileContent()}
          </DrawerContent>
        </Drawer>
      ) : (
        <AlertDialog
          open={isOpen}
          onOpenChange={handleOpenChange}
        >
          <AlertDialogContent
            dir={dir}
            className={cn(
              "flex min-w-0 w-full max-w-xl flex-col overflow-hidden p-0 border-0 shadow-xl",
              isKycOnboarding &&
                "!w-[min(880px,95vw)] !max-w-[880px] !p-0 overflow-hidden rounded-3xl border-0",
            )}
            onEscapeKeyDown={config.preventOutsideClose ? (e) => e.preventDefault() : undefined}
            onInteractOutside={config.preventOutsideClose ? (e) => e.preventDefault() : undefined}
          >
            <AlertDialogTitle className="sr-only">{config.title ?? ""}</AlertDialogTitle>
            <AlertDialogDescription className="m-0 flex min-h-0 min-w-0 w-full max-w-full flex-1 flex-col overflow-hidden p-0 text-base">
              {renderDesktopContent()}
            </AlertDialogDescription>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </AlertDialogContext.Provider>
  )
}

export function useAlertDialog(): AlertDialogContextType {
  const context = useContext(AlertDialogContext)
  if (context === undefined) {
    throw new Error("useAlertDialog must be used within an AlertDialogProvider")
  }
  return context
}
