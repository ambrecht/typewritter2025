"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

const OptionsBar = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn(className)} {...props} />
  )
)
OptionsBar.displayName = "OptionsBar"

export default OptionsBar

