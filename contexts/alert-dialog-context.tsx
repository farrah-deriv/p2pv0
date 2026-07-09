"use client"

import type React from "react"
import { createContext, useContext, useState, useCallback } from "react"
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Drawer, DrawerContent } from "@/components/ui/drawer"
import type { AlertDialogConfig, AlertDialogContextType } from "@/types/alert-dialog"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import Image from "next/image"
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
      await config.onConfirm()
      setIsSubmitting(false)
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

  const contextValue: AlertDialogContextType = {
    showAlert,
    hideAlert,
    isOpen,
  }

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
          <div className="mb-4 flex shrink-0 items-center justify-between gap-4 px-8 pt-6">
            {config.title && <div className="min-w-0 flex-1 text-start text-2xl font-bold">{config.title}</div>}
            {!config.hideCloseButton && (
              <Button onClick={handleClose} variant="ghost" className="min-w-[48px] shrink-0 bg-slate-75 px-1">
                <Image src="/icons/close-icon.png" alt={t("common.close")} width={24} height={24} />
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
                  {config.confirmText || "Continue"}
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
      <div className="px-8 py-6 overflow-y-auto" data-testid={config.testId}>
        <div className="flex justify-between items-center gap-4 mb-8">
          {config.title && <div className="flex-1 min-w-0 text-start font-bold text-2xl">{config.title}</div>}
          {!config.hideCloseButton && (
            <Button onClick={handleClose} variant="ghost" className="bg-slate-75 px-1 min-w-[48px]">
              <Image src="/icons/close-icon.png" alt={t("common.close")} width={24} height={24} />
            </Button>
          )}
        </div>
        {config.description && <div className="text-grayscale-100">{config.description}</div>}
        {(config.cancelText || config.type) && (
          <div className="flex flex-col gap-2 mt-6">
            {config.type && (
              <Button onClick={handleConfirm} disabled={isSubmitting} variant="primary" className="w-full" data-testid={config.confirmTestId}>
                {config.confirmText || "Continue"}
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
        <div className="flex flex-col max-h-[80vh] overflow-hidden">
          {config.title && <div className="mb-4 px-6 pt-6 text-start font-bold text-lg flex-shrink-0">{config.title}</div>}
          <div
            className={cn(
              "px-6 flex-1 min-h-0 flex flex-col overflow-hidden",
              config.contentClassName,
            )}
          >
            {config.content}
          </div>
          {(config.type || config.cancelText) && (
            <div className="flex flex-col gap-2 px-6 py-4 flex-shrink-0 border-t border-grayscale-500">
              {config.type && (
                <Button onClick={handleConfirm} disabled={isSubmitting} variant="primary" className="w-full">
                  {config.confirmText || "Continue"}
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
      <div className="p-6 overflow-y-auto" data-testid={config.testId}>
        {config.title && <div className="mb-8 text-start font-bold text-lg">{config.title}</div>}
        {config.description && <div className="text-grayscale-100">{config.description}</div>}
        {(config.cancelText || config.type) && (<div className="flex flex-col gap-2 mt-8">
          {config.type && (
            <Button onClick={handleConfirm} disabled={isSubmitting} variant="primary" className="w-full" data-testid={config.confirmTestId}>
              {config.confirmText || "Continue"}
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
        <Drawer open={isOpen} onOpenChange={(open) => {
          if (!open && config.preventOutsideClose) return
          setIsOpen(open)
          if (!open) config.onClose?.()
        }}>
          <DrawerContent
            dir={dir}
            hideHandle={isKycOnboarding}
            className={cn(
              "p-0",
              isKycOnboarding
                ? "max-h-[95vh] overflow-hidden rounded-t-2xl border-0"
                : "rounded-t-[16px]",
            )}
          >
            {renderMobileContent()}
          </DrawerContent>
        </Drawer>
      ) : (
        <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
          <AlertDialogTitle></AlertDialogTitle>
          <AlertDialogContent
            dir={dir}
            className={cn(
              "flex min-w-0 w-full max-w-xl flex-col overflow-hidden p-0",
              isKycOnboarding &&
                "!w-[min(880px,95vw)] !max-w-[880px] !p-0 overflow-hidden rounded-3xl border-0",
            )}
            onEscapeKeyDown={config.preventOutsideClose ? (e) => e.preventDefault() : undefined}
            onInteractOutside={config.preventOutsideClose ? (e) => e.preventDefault() : undefined}
          >
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
