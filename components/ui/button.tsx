import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        // Add new variants based on our custom colors
        success: "bg-success text-white hover:bg-success/90",
        error: "bg-error text-white hover:bg-error/90",
        warning: "bg-warning-bg text-warning-icon hover:bg-warning-bg/90",
        buy: "bg-buy text-white hover:bg-buy/90",
        sell: "bg-sell text-white hover:bg-sell/90",
        cyan: "bg-primary hover:bg-cyan-hover text-black",
        blue: "bg-blue text-white hover:bg-blue/90",
        info: "bg-info text-white hover:bg-info/90",
        pending: "bg-pending text-white hover:bg-pending/90",
        completed: "bg-completed text-white hover:bg-completed/90",
        cancelled: "bg-cancelled text-white hover:bg-cancelled/90",
        disputed: "bg-disputed text-white hover:bg-disputed/90",
        // Outline variants
        "outline-success": "border border-success text-success bg-white hover:bg-success/10",
        "outline-error": "border border-error text-error bg-white hover:bg-error/10",
        "outline-warning": "border border-warning-icon text-warning-icon bg-white hover:bg-warning-bg/50",
        "outline-buy": "border border-buy text-buy bg-white hover:bg-buy/10",
        "outline-sell": "border border-sell text-sell bg-white hover:bg-sell/10",
        "outline-blue": "border border-blue text-blue bg-white hover:bg-blue/10",
        "outline-info": "border border-info text-info bg-white hover:bg-info/10",
        "outline-pending": "border border-pending text-pending bg-white hover:bg-pending/10",
        "outline-completed": "border border-completed text-completed bg-white hover:bg-completed/10",
        "outline-cancelled": "border border-cancelled text-cancelled bg-white hover:bg-cancelled/10",
        "outline-disputed": "border border-disputed text-disputed bg-white hover:bg-disputed/10",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
        // Add new sizes
        xl: "h-12 rounded-md px-10 text-base",
        "2xl": "h-14 rounded-md px-12 text-lg",
        pill: "h-10 rounded-full px-6",
        "pill-sm": "h-8 rounded-full px-4 text-xs",
        "pill-lg": "h-14 rounded-full px-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
  },
)
Button.displayName = "Button"

export { Button, buttonVariants }

