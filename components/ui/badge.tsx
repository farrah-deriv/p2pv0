import type React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        // Add new variants based on our custom colors
        success: "border-transparent bg-success text-white hover:bg-success/80",
        "success-light": "border-transparent bg-success-light text-success hover:bg-success-light/80",
        error: "border-transparent bg-error text-white hover:bg-error/80",
        "error-light": "border-transparent bg-error-light text-error hover:bg-error-light/80",
        warning: "border-transparent bg-warning-bg text-warning-icon hover:bg-warning-bg/80",
        buy: "border-transparent bg-buy text-white hover:bg-buy/80",
        sell: "border-transparent bg-sell text-white hover:bg-sell/80",
        blue: "border-transparent bg-blue text-white hover:bg-blue/80",
        "blue-light": "border-transparent bg-blue-light text-blue hover:bg-blue-light/80",
        active: "border-transparent bg-success-light text-success hover:bg-success-light/80",
        inactive: "border-transparent bg-error-light text-error hover:bg-error-light/80",
        info: "border-transparent bg-info-light text-info hover:bg-info-light/80",
        pending: "border-transparent bg-pending-light text-pending hover:bg-pending-light/80",
        completed: "border-transparent bg-completed-light text-completed hover:bg-completed-light/80",
        cancelled: "border-transparent bg-cancelled-light text-cancelled hover:bg-cancelled-light/80",
        disputed: "border-transparent bg-disputed-light text-disputed hover:bg-disputed-light/80",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
)

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> { }

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
