import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const inputVariants = cva(
  "flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "border-input ring-offset-background placeholder:text-muted-foreground focus:border-[#000000] focus:outline-none focus:ring-0",
        secondary:
          "h-[32px] bg-white border border-input rounded-lg px-2 flex flex-row items-center gap-2 focus-visible:outline-none focus:border-black focus:ring-0 placeholder:text-[#0000003D] pl-10 pr-4",
        tertiary:
          "h-[32px] bg-gray-100 border-transparent rounded-lg px-2 flex flex-row items-center gap-2 focus-visible:outline-none focus:border-black focus:ring-0 placeholder:text-[#0000003D] pl-10 pr-4",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
)

const VALID_VARIANTS = ["default", "secondary", "tertiary"]

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement>, VariantProps<typeof inputVariants> { }

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, variant, type, ...props }, ref) => {
  const computedVariant = VALID_VARIANTS.includes(variant as string) ? variant : "default"

  return (
    <input type={type} className={cn(inputVariants({ variant: computedVariant }), className)} ref={ref} {...props} />
  )
})
Input.displayName = "Input"

export { Input, inputVariants }
