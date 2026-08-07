"use client"

import * as React from "react"
import { SectionMessage } from "@deriv-com/quill-ui-v2"

import { cn } from "@/lib/utils"

type AlertVariant = "default" | "destructive" | "warning" | "info"

const statusMap: Record<AlertVariant, "default" | "danger" | "warning" | "information"> = {
  default: "default",
  destructive: "danger",
  warning: "warning",
  info: "information",
}

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ variant = "default", className, children }, ref) => (
    <SectionMessage
      ref={ref}
      status={statusMap[variant]}
      showTitle={false}
      showDescription={false}
className={cn(className)}
    >
      {children}
    </SectionMessage>
  ),
)
Alert.displayName = "Alert"

const AlertTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h5 ref={ref} className={cn("mb-1 font-medium leading-none tracking-tight", className)} {...props} />
  ),
)
AlertTitle.displayName = "AlertTitle"

const AlertDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("text-sm [&_p]:leading-relaxed", className)} {...props} />
  ),
)
AlertDescription.displayName = "AlertDescription"

export { Alert, AlertTitle, AlertDescription }
