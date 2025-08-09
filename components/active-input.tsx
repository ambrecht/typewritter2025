"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

const ActiveInput = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, style, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(className)}
    style={{ height: "var(--lineHpx)", lineHeight: "var(--lineHpx)", ...style }}
    {...props}
  />
))
ActiveInput.displayName = "ActiveInput"

export default ActiveInput
