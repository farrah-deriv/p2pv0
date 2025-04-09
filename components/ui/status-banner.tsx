"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Check, AlertCircle, Info, X } from "lucide-react"

import { cn } from "@/lib/utils"

const statusBannerVariants = cva("fixed top-4 left-0 right-0 z-50 flex justify-center", {
  variants: {
    variant: {
      success: "",
      error: "",
      warning: "",
      info: "",
      pending: "",
      completed: "",
      cancelled: "",
      disputed: "",
    },
  },
  defaultVariants: {
    variant: "success",
  },
})

const statusBannerContentVariants = cva("py-3 px-4 rounded-lg flex items-center justify-center max-w-[600px] mx-auto", {
  variants: {
    variant: {
      success: "bg-success text-white",
      error: "bg-error text-white",
      warning: "bg-warning-bg text-warning-icon",
      info: "bg-info text-white",
      pending: "bg-pending text-white",
      completed: "bg-completed text-white",
      cancelled: "bg-cancelled text-white",
      disputed: "bg-disputed text-white",
    },
  },
  defaultVariants: {
    variant: "success",
  },
})

export interface StatusBannerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof statusBannerVariants> {
  message: string
  onClose?: () => void
  showIcon?: boolean
  autoHideDuration?: number | null
}

const StatusBanner = React.forwardRef<HTMLDivElement, StatusBannerProps>(
  ({ className, variant, message, onClose, showIcon = true, autoHideDuration = 5000, ...props }, ref) => {
    React.useEffect(() => {
      if (autoHideDuration !== null && onClose) {
        const timer = setTimeout(() => {
          onClose()
        }, autoHideDuration)
        return () => clearTimeout(timer)
      }
    }, [autoHideDuration, onClose])

    const IconComponent = {
      success: Check,
      error: AlertCircle,
      warning: AlertCircle,
      info: Info,
      pending: Info,
      completed: Check,
      cancelled: X,
      disputed: AlertCircle,
    }[variant || "success"]

    return (
      <div ref={ref} className={cn(statusBannerVariants({ variant, className }))} {...props}>
        <div className="container mx-auto px-4">
          <div className={cn(statusBannerContentVariants({ variant }))}>
            {showIcon && <IconComponent className="h-5 w-5 mr-2" />}
            <span>{message}</span>
            {onClose && (
              <button onClick={onClose} className="ml-4 text-current hover:opacity-80" aria-label="Close">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    )
  },
)
StatusBanner.displayName = "StatusBanner"

export { StatusBanner, statusBannerVariants, statusBannerContentVariants }
