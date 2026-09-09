"use client"

import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { StandaloneCheckBoldIcon } from "@deriv/quill-icons/Standalone"

import { cn } from "@/lib/utils"

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      "peer relative h-4 w-4 shrink-0 rounded-[2px] border-2 border-grayscale-text-muted ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-slate-1200 data-[state=checked]:border-slate-1200 data-[state=checked]:text-white data-[state=indeterminate]:bg-slate-1200 data-[state=indeterminate]:border-slate-1200 data-[state=indeterminate]:text-white",
      className,
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator className={cn("absolute inset-0 flex items-center justify-center text-current [&_path]:fill-current [&_svg]:h-3 [&_svg]:w-3")}>
      <StandaloneCheckBoldIcon iconSize="xs" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
))
Checkbox.displayName = CheckboxPrimitive.Root.displayName

export { Checkbox }
