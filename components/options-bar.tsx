"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * OptionsBar
 * - Fixed at top as a normal flex child (no overlays)
 * - Fixed height via className (e.g., h-[40px])
 * - Full width, subtle border/shadow
 */
const OptionsBar = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "w-screen flex items-center justify-between",
        "border-b border-neutral-200 dark:border-neutral-800",
        "bg-[#f3efe9] dark:bg-neutral-900",
        "shadow-[0_2px_8px_rgba(0,0,0,0.04)]",
        className,
      )}
      {...props}
    />
  ),
)
OptionsBar.displayName = "OptionsBar"

export default OptionsBar
