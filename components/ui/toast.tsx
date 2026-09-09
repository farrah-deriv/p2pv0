"use client"

import * as React from "react"
import { Snackbar } from "@deriv-com/quill-ui-v2"
import { StandaloneXmarkRegularIcon } from "@deriv/quill-icons/Standalone"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

// Context so ToastClose (rendered as a child) can access the close handler
const ToastCloseCtx = React.createContext<(() => void) | null>(null)

export interface ToastProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  duration?: number
  variant?: "default" | "destructive"
  className?: string
}

export type ToastActionElement = React.ReactElement<typeof ToastAction>

export const ToastProvider = ({ children }: { children: React.ReactNode }) => <>{children}</>

export const ToastViewport = (_props: React.HTMLAttributes<HTMLDivElement>) => null

export const Toast = React.forwardRef<HTMLDivElement, ToastProps & { children?: React.ReactNode }>(
  ({ open = true, onOpenChange, duration, variant, className, children }, _ref) => {
    const handleClose = React.useCallback(() => onOpenChange?.(false), [onOpenChange])
    const snackbarRef = React.useRef<HTMLDivElement>(null)

    React.useLayoutEffect(() => {
      const el = snackbarRef.current
      if (!el || typeof window === "undefined") return

      const applySize = () => {
        const responsive = window.innerWidth <= 768
        const responsiveWidth = "calc(100vw - 2rem)"
        el.style.setProperty("box-sizing", "border-box", "important")
        el.style.setProperty("min-width", "auto", "important")
        el.style.setProperty(
          "width",
          responsive ? responsiveWidth : "fit-content",
          "important",
        )
        el.style.setProperty(
          "max-width",
          responsive ? responsiveWidth : "32rem",
          "important",
        )
        el.style.setProperty("left", "50%", "important")
        el.style.setProperty("right", "auto", "important")
        el.style.setProperty("transform", "translateX(-50%)", "important")
      }

      applySize()
      window.addEventListener("resize", applySize)
      return () => window.removeEventListener("resize", applySize)
    }, [open])

    return (
      <ToastCloseCtx.Provider value={handleClose}>
        <Snackbar
          ref={snackbarRef}
          visible={open}
          type={variant === "destructive" ? "fail" : "default"}
          position="top-center"
          autoHideDuration={duration ?? 5000}
          onClose={handleClose}
          showClose={false}
          className={cn(className)}
        >
          {children}
        </Snackbar>
      </ToastCloseCtx.Provider>
    )
  },
)
Toast.displayName = "Toast"

export const ToastAction = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { altText: string }
>(({ className, altText: _altText, children, ...props }, ref) => (
  <Button
    ref={ref}
    variant="ghost"
    className={cn("!h-8 !shrink-0 !rounded-md !border !px-3 !text-sm !font-medium", className)}
    {...props}
  >
    {children}
  </Button>
))
ToastAction.displayName = "ToastAction"

export const ToastClose = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className, onClick, ...props }, ref) => {
    const handleClose = React.useContext(ToastCloseCtx)
    return (
      <Button
        ref={ref}
        variant="icon-muted"
        className={cn("!absolute !end-2 !top-2 !opacity-0 group-hover:!opacity-100 focus:!opacity-100 !transition-opacity", className)}
        onClick={(e) => {
          handleClose?.()
          onClick?.(e)
        }}
        {...props}
      >
        <StandaloneXmarkRegularIcon iconSize="xs" />
      </Button>
    )
  },
)
ToastClose.displayName = "ToastClose"

export const ToastTitle = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("text-sm font-semibold", className)} {...props} />
  ),
)
ToastTitle.displayName = "ToastTitle"

export const ToastDescription = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("min-w-0 text-sm opacity-90 [&_span]:break-words", className)}
      {...props}
    />
  ),
)
ToastDescription.displayName = "ToastDescription"
