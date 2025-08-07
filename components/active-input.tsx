"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

const ActiveInput = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn(className)} {...props} />
  )
)
ActiveInput.displayName = "ActiveInput"

export default ActiveInput

