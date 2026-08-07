"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { RTL_TABS_LIST } from "@/lib/rtl"
import { cn } from "@/lib/utils"

interface TabsCtx {
  value: string
  onValueChange: (v: string) => void
}

const TabsContext = React.createContext<TabsCtx>({ value: "", onValueChange: () => {} })

interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: string
  defaultValue?: string
  onValueChange?: (v: string) => void
}

const Tabs = React.forwardRef<HTMLDivElement, TabsProps>(
  ({ value: ctrl, defaultValue, onValueChange, children, className, ...rest }, ref) => {
    const [internal, setInternal] = React.useState(defaultValue ?? "")
    const active = ctrl ?? internal
    const handleChange = (v: string) => {
      if (ctrl === undefined) setInternal(v)
      onValueChange?.(v)
    }
    return (
      <TabsContext.Provider value={{ value: active, onValueChange: handleChange }}>
        <div ref={ref} className={cn(className)} {...rest}>
          {children}
        </div>
      </TabsContext.Provider>
    )
  },
)
Tabs.displayName = "Tabs"

const TabsList = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      role="tablist"
      className={cn(
        "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
        RTL_TABS_LIST,
        className,
      )}
      {...props}
    />
  ),
)
TabsList.displayName = "TabsList"

const tabsTriggerVariants = cva(
  "relative inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-normal ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
        underline:
          "rounded-none bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-foreground after:absolute after:bottom-0 after:inset-x-0 after:h-0.5 after:bg-transparent after:transition-colors data-[state=active]:after:bg-slate-1200",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
)

export interface TabsTriggerProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof tabsTriggerVariants> {
  value?: string
}

const TabsTrigger = React.forwardRef<HTMLButtonElement, TabsTriggerProps>(
  ({ className, variant, value: triggerValue, disabled, children, ...props }, ref) => {
    const { value, onValueChange } = React.useContext(TabsContext)
    const isActive = value === triggerValue
    return (
      <button
        ref={ref}
        role="tab"
        data-state={isActive ? "active" : "inactive"}
        aria-selected={isActive}
        disabled={disabled}
        onClick={() => !disabled && triggerValue !== undefined && onValueChange(triggerValue)}
        className={cn(tabsTriggerVariants({ variant }), className)}
        {...props}
      >
        {children}
      </button>
    )
  },
)
TabsTrigger.displayName = "TabsTrigger"

const TabsContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { value?: string }
>(({ className, value: contentValue, children, ...props }, ref) => {
  const { value } = React.useContext(TabsContext)
  const isActive = value === contentValue
  return (
    <div
      ref={ref}
      role="tabpanel"
      hidden={!isActive}
      data-state={isActive ? "active" : "inactive"}
      className={cn(
        "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
})
TabsContent.displayName = "TabsContent"

export { Tabs, TabsList, TabsTrigger, TabsContent }
