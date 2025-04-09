import type * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const statusIndicatorVariants = cva("inline-flex items-center gap-2 text-black", {
  variants: {
    variant: {
      default: "",
      success: "",
      error: "",
      warning: "",
      buy: "",
      sell: "",
      blue: "",
      neutral: "",
      info: "",
      pending: "",
      completed: "",
      cancelled: "",
      disputed: "",
    },
    size: {
      default: "text-sm",
      sm: "text-xs",
      lg: "text-base",
    },
    withDot: {
      true: "before:content-[''] before:block before:w-2 before:h-2 before:rounded-full before:mr-1.5",
      false: "",
    },
  },
  compoundVariants: [
    {
      withDot: true,
      variant: "success",
      className: "before:bg-success",
    },
    {
      withDot: true,
      variant: "error",
      className: "before:bg-error",
    },
    {
      withDot: true,
      variant: "warning",
      className: "before:bg-warning-icon",
    },
    {
      withDot: true,
      variant: "buy",
      className: "before:bg-buy",
    },
    {
      withDot: true,
      variant: "sell",
      className: "before:bg-sell",
    },
    {
      withDot: true,
      variant: "blue",
      className: "before:bg-blue",
    },
    {
      withDot: true,
      variant: "neutral",
      className: "before:bg-neutral-7",
    },
    {
      withDot: true,
      variant: "info",
      className: "before:bg-info",
    },
    {
      withDot: true,
      variant: "pending",
      className: "before:bg-pending",
    },
    {
      withDot: true,
      variant: "completed",
      className: "before:bg-completed",
    },
    {
      withDot: true,
      variant: "cancelled",
      className: "before:bg-cancelled",
    },
    {
      withDot: true,
      variant: "disputed",
      className: "before:bg-disputed",
    },
  ],
  defaultVariants: {
    variant: "default",
    size: "default",
    withDot: false,
  },
})

export interface StatusIndicatorProps
  extends React.HTMLAttributes<HTMLSpanElement>,
  VariantProps<typeof statusIndicatorVariants> { }

function StatusIndicator({ className, variant, size, withDot, ...props }: StatusIndicatorProps) {
  return <span className={cn(statusIndicatorVariants({ variant, size, withDot, className }))} {...props} />
}

export { StatusIndicator, statusIndicatorVariants }
