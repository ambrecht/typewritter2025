"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

const ActiveInput = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, style, ...props }, ref) => (
    <div
      ref={ref}
      style={{ ...style, height: "var(--lineHpx)", lineHeight: "var(--lineHpx)" }}
      className={cn(className)}
      {...props}
    />
  )
)
ActiveInput.displayName = "ActiveInput"

export default ActiveInput

