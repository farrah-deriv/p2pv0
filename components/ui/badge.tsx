"use client"

import * as React from "react"
import { Tag } from "@deriv-com/quill-ui-v2"
import type { TagProps } from "@deriv-com/quill-ui-v2"

import { cn } from "@/lib/utils"

type BadgeVariant =
  | "default"
  | "secondary"
  | "destructive"
  | "outline"
  | "success"
  | "success-light"
  | "success-secondary"
  | "error"
  | "error-light"
  | "error-secondary"
  | "warning"
  | "buy"
  | "sell"
  | "blue"
  | "blue-light"
  | "active"
  | "inactive"
  | "info"
  | "pending"
  | "pending-secondary"
  | "completed"
  | "cancelled"
  | "disputed"

const variantMap: Record<BadgeVariant, Pick<TagProps, "state" | "type">> = {
  default:            { state: "neutral", type: "fill" },
  secondary:          { state: "neutral", type: "fill" },
  inactive:           { state: "neutral", type: "fill" },
  cancelled:          { state: "neutral", type: "fill" },
  outline:            { state: "neutral", type: "outline" },
  destructive:        { state: "red",     type: "fill" },
  error:              { state: "red",     type: "fill" },
  sell:               { state: "red",     type: "fill" },
  disputed:           { state: "red",     type: "fill" },
  "error-light":      { state: "red",     type: "outline" },
  "error-secondary":  { state: "red",     type: "outline" },
  warning:            { state: "yellow",  type: "fill" },
  pending:            { state: "yellow",  type: "fill" },
  "pending-secondary":{ state: "yellow",  type: "outline" },
  success:            { state: "green",   type: "fill" },
  active:             { state: "green",   type: "fill" },
  completed:          { state: "green",   type: "fill" },
  "success-light":    { state: "green",   type: "outline" },
  "success-secondary":{ state: "green",   type: "outline" },
  info:               { state: "blue",    type: "fill" },
  blue:               { state: "blue",    type: "fill" },
  buy:                { state: "blue",    type: "fill" },
  "blue-light":       { state: "blue",    type: "outline" },
}

export interface BadgeProps {
  variant?: BadgeVariant
  className?: string
  children?: React.ReactNode
}

function Badge({ className, variant = "default", children }: BadgeProps) {
  const { state, type } = variantMap[variant] ?? variantMap.default
  return (
    <Tag
      state={state}
      type={type}
      size="sm"
      label={children != null ? String(children) : undefined}
      className={cn(className)}
    />
  )
}

export const badgeVariants = (_opts?: { variant?: string }) => ""

export { Badge }
