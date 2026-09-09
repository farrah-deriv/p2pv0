"use client"

import * as React from "react"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"
import { Tooltip as QuillTooltip } from "@deriv-com/quill-ui-v2"

import { useState } from "react"

const TooltipProvider = TooltipPrimitive.Provider

const Tooltip = ({ children, ...props }: React.ComponentProps<typeof TooltipPrimitive.Root>) => {
  const [open, setOpen] = useState(false)

  return (
    <TooltipPrimitive.Root
      open={open}
      onOpenChange={setOpen}
      delayDuration={Number.POSITIVE_INFINITY}
      disableHoverableContent
      {...props}
    >
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child) && child.type === TooltipTrigger) {
          const typedChild = child as React.ReactElement<React.ComponentProps<typeof TooltipTrigger>>
          return React.cloneElement(typedChild, { onOpenChange: setOpen, open })
        }
        return child
      })}
    </TooltipPrimitive.Root>
  )
}

const TooltipTrigger = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Trigger> & {
    onOpenChange?: (open: boolean) => void
    open?: boolean
  }
>(({ children, onOpenChange, open, ...props }, ref) => {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onOpenChange?.(!open)
  }

  return (
    <TooltipPrimitive.Trigger ref={ref} onClick={handleClick} onPointerDown={(e) => e.preventDefault()} {...props}>
      {children}
    </TooltipPrimitive.Trigger>
  )
})
TooltipTrigger.displayName = "TooltipTrigger"

// No-op sentinel — presence in children signals Quill to render its arrow
const TooltipArrow = (_props: { className?: string }) => null
TooltipArrow.displayName = "TooltipArrow"

// Radix side → Quill arrow direction (arrow points from tooltip toward trigger)
const sideToArrow: Record<string, "top" | "left" | "right" | "bottom"> = {
  top: "bottom",
  bottom: "top",
  left: "right",
  right: "left",
}

// Radix align → Quill arrowAlign (keeps arrow over the trigger when bubble is shifted)
const alignToArrowAlign: Record<string, "start" | "center" | "end"> = {
  start: "start",
  center: "center",
  end: "end",
}

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, side = "top", align = "center", children, ...props }, ref) => {
  const childArray = React.Children.toArray(children)

  // Detect if caller included <TooltipArrow /> to opt into arrow rendering
  const hasArrow = childArray.some((c) => React.isValidElement(c) && c.type === TooltipArrow)
  const contentChildren = childArray.filter((c) => !(React.isValidElement(c) && c.type === TooltipArrow))

  return (
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      side={side}
      align={align}
      // Outer wrapper: transparent positioning shell only
      className="z-50 p-0 bg-transparent border-0 shadow-none overflow-visible"
      {...props}
    >
      {/* Caller className goes to Quill's styled bubble, not the positioning shell */}
      <QuillTooltip
        arrow={hasArrow ? sideToArrow[side] : "none"}
        arrowAlign={alignToArrowAlign[align] ?? "center"}
        className={className}
      >
        {contentChildren}
      </QuillTooltip>
    </TooltipPrimitive.Content>
  )
})
TooltipContent.displayName = TooltipPrimitive.Content.displayName

export { Tooltip, TooltipArrow, TooltipTrigger, TooltipContent, TooltipProvider }
