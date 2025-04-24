import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const inputVariants = cva(
  "flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "border-input ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 placeholder:text-muted-foreground",
        secondary:
          "border-input focus-visible:outline-none focus:border-black/10 focus:ring-0 placeholder:text-[#0000003D] pl-10 pr-4",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
)


const VALID_VARIANTS = ["default", "secondary"]

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement>, VariantProps<typeof inputVariants> { }

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, variant, type, ...props }, ref) => {

  const computedVariant = VALID_VARIANTS.includes(variant as string) ? variant : "default"

  return (
    <input type={type} className={cn(inputVariants({ variant: computedVariant, className }))} ref={ref} {...props} />
  )
})
Input.displayName = "Input"

export { Input, inputVariants }
