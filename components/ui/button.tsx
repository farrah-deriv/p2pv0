"use client"

import * as React from "react"
import { Button as QuillButton, type ButtonProps as QuillButtonProps } from "@deriv-com/quill-ui-v2"
// Map legacy variant names to Quill type values
const variantToType: Record<string, QuillButtonProps["type"]> = {
  default: "primary",
  primary: "primary",
  hover: "primary",
  secondary: "secondary",
  ghost: "ghost",
  link: "ghost",
  chip: "ghost",
  outline: "tertiary",
  destructive: "primary",
  black: "primary",
  buy: "primary",
  "icon-muted": "ghost",
  "icon-action": "primary",
  "icon-action-outlined": "ghost",
  "outline-white": "ghost",
  "secondary-outline": "ghost",
}

// Map legacy size names to Quill size values
const sizeMap: Record<string, QuillButtonProps["size"]> = {
  default: "lg",
  lg: "lg",
  sm: "sm",
  xs: "sm",
  icon: "sm",
}

export interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "type"> {
  variant?: "default" | "primary" | "hover" | "black" | "outline" | "destructive" | "secondary" | "ghost" | "link" | "buy" | "chip" | "icon-muted" | "icon-action" | "icon-action-outlined" | "outline-white" | "secondary-outline"
  size?: "default" | "sm" | "xs" | "lg" | "icon"
  asChild?: boolean
  /** HTML button type — passed as htmlType to Quill Button */
  type?: "button" | "submit" | "reset"
}

const RED_DISABLED_VARIANTS = new Set(["default", "primary", "hover", "destructive"])

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", type = "button", disabled, onClick, children, ...rest }, ref) => {
    const quillType = variantToType[variant] ?? "primary"
    const quillSize = sizeMap[size] ?? "lg"

    // icon-muted: 32×32px ghost circle for nav/close icon buttons
    // icon-action: 48×48px filled brand-red circle (Quill primary = brand red, no color override needed)
    // icon-action-outlined: 48×48px transparent circle with border
    // buy: green filled button for P2P buy action
    const variantClass =
      variant === "icon-muted"
        ? "!rounded-full !w-8 !h-8 !p-0 !min-w-0 !bg-black/[0.06] hover:!bg-black/10"
        : variant === "icon-action"
          ? "!rounded-full !w-12 !h-12 !p-0 !min-w-0"
          : variant === "icon-action-outlined"
            ? "!rounded-full !w-12 !h-12 !p-0 !min-w-0 !bg-transparent !border !border-slate-1200 hover:!bg-black/10"
            : variant === "secondary-outline"
            ? "!bg-transparent !border !border-solid !border-slate-1200 hover:!bg-black/5"
            : variant === "buy"
              ? "!bg-success-text-secondary hover:!bg-success-text-secondary-hover !text-white !border-0"
              : variant === "outline-white"
                ? "!bg-transparent !border !border-white !text-white hover:!bg-white/10 !flex-row !items-center"
                : variant === "link"
                  ? "!inline !h-auto !p-0 !min-w-0 !bg-transparent hover:!bg-transparent"
                  : variant === "ghost" || variant === "outline"
                  ? "!flex-row !items-center"
                  : variant === "chip"
                    ? "!rounded-full !border !border-neutral-200 !bg-transparent !text-neutral-600 !text-xs !font-medium !px-3 !py-2 !h-auto !min-h-0 !min-w-0"
                    : undefined

    const disabledClass = disabled && RED_DISABLED_VARIANTS.has(variant) ? "!bg-brand-red/30 !opacity-100 !text-white" : undefined

    return (
      <QuillButton
        ref={ref}
        type={quillType}
        size={quillSize}
        htmlType={type}
        disabled={disabled}
        state={disabled ? "disabled" : undefined}
        onClick={onClick}
        className={["transition-colors", variantClass, disabledClass, className].filter(Boolean).join(" ") || undefined}
        {...(rest as Partial<QuillButtonProps>)}
      >
        {children}
      </QuillButton>
    )
  },
)
Button.displayName = "Button"

// Keep buttonVariants shim so any callers that import it don't break at compile time
export const buttonVariants = (_opts?: { variant?: string; size?: string }) => ""

export { Button }
