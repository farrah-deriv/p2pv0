import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { AlertCircle, CheckCircle, Info, XCircle } from "lucide-react"

import { cn } from "@/lib/utils"

const alertVariants = cva(
  "relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground",
        destructive: "border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive",
        // Add new variants based on our custom colors
        success: "border-success/50 bg-success-light text-success [&>svg]:text-success",
        error: "border-error/50 bg-error-light text-error [&>svg]:text-error",
        warning: "border-warning-icon/50 bg-warning-bg text-warning-icon [&>svg]:text-warning-icon",
        info: "border-info/50 bg-info-light text-info [&>svg]:text-info",
        pending: "border-pending/50 bg-pending-light text-pending [&>svg]:text-pending",
        completed: "border-completed/50 bg-completed-light text-completed [&>svg]:text-completed",
        cancelled: "border-cancelled/50 bg-cancelled-light text-cancelled [&>svg]:text-cancelled",
        disputed: "border-disputed/50 bg-disputed-light text-disputed [&>svg]:text-disputed",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
)

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => (
  <div ref={ref} role="alert" className={cn(alertVariants({ variant }), className)} {...props} />
))
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

// Create a component that combines Alert with the appropriate icon
interface AlertWithIconProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof alertVariants> {
  title?: string
  description?: string
}

const AlertWithIcon = React.forwardRef<HTMLDivElement, AlertWithIconProps>(
  ({ variant = "default", title, description, className, children, ...props }, ref) => {
    const IconComponent = {
      success: CheckCircle,
      error: XCircle,
      warning: AlertCircle,
      info: Info,
      default: Info,
      destructive: XCircle,
      pending: AlertCircle,
      completed: CheckCircle,
      cancelled: XCircle,
      disputed: AlertCircle,
    }[variant || "default"]

    return (
      <Alert ref={ref} variant={variant} className={className} {...props}>
        <IconComponent className="h-4 w-4" />
        {title && <AlertTitle>{title}</AlertTitle>}
        <AlertDescription>{description || children}</AlertDescription>
      </Alert>
    )
  },
)
AlertWithIcon.displayName = "AlertWithIcon"

export { Alert, AlertTitle, AlertDescription, AlertWithIcon, alertVariants }
