import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex flex-row items-center justify-center gap-2 rounded-full font-extrabold text-base leading-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 z-0 font-[800] text-[16px] leading-[16px] text-center text-default-button-text",
  {
    variants: {
      variant: {
        default: "bg-primary text-default-button-text hover:bg-cyan-hover",
        hover: "bg-cyan-hover text-default-button-text",
        disabled: "bg-primary opacity-24 pointer-events-none cursor-not-allowed text-default-button-text",
        outline: "border border-[#181C25] bg-transparent text-foreground hover:bg-slate-100 px-7",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        secondary: "bg-secondary text-white hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
      },
      size: {
        default: "h-[48px] min-h-[48px] max-h-[48px] px-7 gap-2 min-w-[96px]",
        sm: "h-10 min-h-10 max-h-10 px-4 gap-1 text-sm",
        lg: "h-11 rounded-[16px] px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

const VALID_VARIANTS = ["default", "hover", "disabled", "outline", "destructive", "secondary", "ghost"]
const VALID_SIZES = ["default", "sm"]

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, disabled, ...props }, ref) => {
    const computedVariant = disabled ? "disabled" : VALID_VARIANTS.includes(variant as string) ? variant : "default"
    const computedSize = VALID_SIZES.includes(size as string) ? size : "default"

    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant: computedVariant, size: computedSize }), className)}
        ref={ref}
        disabled={disabled}
        {...props}
      />
    )
  },
)
Button.displayName = "Button"

export { Button, buttonVariants }
