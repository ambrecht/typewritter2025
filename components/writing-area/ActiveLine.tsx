"use client"

import type React from "react"

import { cn } from "@/lib/utils"
import { forwardRef } from "react"

interface ActiveLineProps {
  activeLine: string
  darkMode: boolean
  fontSize: number
  lineHeightPx: number
  showCursor: boolean
  maxCharsPerLine: number
  hiddenInputRef?: React.RefObject<HTMLTextAreaElement>
  activeLineRef?: React.RefObject<HTMLDivElement>
  isAndroid?: boolean
  progress?: number // 0..1
}

/**
 * Visual active compose line:
 * - Rounded beige pill (light), or neutral dark in dark mode
 * - Thin amber progress bar sitting directly above the pill
 * - Small amber dot at the left
 */
export const ActiveLine = forwardRef<HTMLDivElement, ActiveLineProps>(function ActiveLine(
  { activeLine, darkMode, fontSize, lineHeightPx, showCursor, progress = 0 },
  _,
) {
  const pct = Math.max(0, Math.min(1, progress)) * 100

  return (
    <div className="relative w-full px-4 sm:px-6 md:px-8">
      {/* Progress bar just above the pill; no layout shift */}
      <div className="absolute left-4 right-4 -top-1 h-[3px] rounded-full bg-amber-200/60 overflow-hidden">
        <div
          className="h-full bg-amber-500 transition-[width] duration-300 ease-out"
          style={{ width: `${pct}%` }}
          aria-hidden="true"
        />
      </div>

      {/* Pill container */}
      <div
        ref={undefined}
        className={cn(
          "w-full rounded-xl border shadow-sm",
          darkMode ? "bg-[#1b1b1b] border-neutral-800 text-[#EDEAE3]" : "bg-[#f6efe6] border-[#efe8dc] text-[#2a2926]",
        )}
        style={{
          height: `${lineHeightPx}px`,
          lineHeight: `${lineHeightPx}px`,
          paddingLeft: "1rem",
          paddingRight: "1rem",
        }}
      >
        <div className="mx-auto flex w-full items-center" style={{ fontSize: `${fontSize}px` }}>
          <span className="mr-3 inline-block h-2 w-2 rounded-full bg-amber-500" aria-hidden="true" />
          <div
            className={cn("flex-1 font-serif whitespace-nowrap overflow-hidden text-ellipsis")}
            aria-live="polite"
            aria-atomic="true"
          >
            {/* Render text string only */}
            <span>{activeLine}</span>
            <span
              className={cn("inline-block w-[1px] align-baseline", showCursor ? "opacity-100" : "opacity-0")}
              style={{
                height: `${Math.max(12, Math.round(fontSize * 0.9))}px`,
                marginLeft: "2px",
                borderLeftWidth: "2px",
                borderLeftStyle: "solid",
                borderLeftColor: darkMode ? "#EDEAE3" : "#2a2926",
                transform: "translateY(2px)",
              }}
              aria-hidden="true"
            />
          </div>
        </div>
      </div>
    </div>
  )
})
