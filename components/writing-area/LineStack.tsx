"use client"

import { memo } from "react"
import { cn } from "@/lib/utils"

export type VisibleLine = { text: string; index: number; key: string }

interface LineStackProps {
  visibleLines: VisibleLine[]
  lineHeightPx: number
  fontSizePx: number
  selectedIndex: number | null
}

/**
 * Clipped vertical stack. It never scrolls; shows only the last N lines.
 * The newest visible line sits at the bottom, directly above the ACL.
 */
export const LineStack = memo(function LineStack({
  visibleLines,
  lineHeightPx,
  fontSizePx,
  selectedIndex,
}: LineStackProps) {
  return (
    <div
      className="line-stack"
      style={{
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        height: "100%",
        gap: "0",
        padding: "0",
        margin: 0,
      }}
    >
      {visibleLines.map(({ text, index, key }) => {
        const isSelected = selectedIndex === index
        return (
          <div
            key={key}
            data-line-index={index}
            className={cn(
              "font-serif",
              isSelected
                ? "rounded-sm ring-1 ring-amber-400/60 bg-amber-200/25 dark:bg-amber-400/10 shadow-[0_0_0_2px_rgba(251,191,36,0.22)_inset]"
                : "bg-transparent",
            )}
            style={{
              margin: 0,
              padding: "0 0.5rem",
              height: `${lineHeightPx}px`,
              lineHeight: `${lineHeightPx}px`,
              fontSize: `${fontSizePx}px`,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "clip",
            }}
          >
            {/* Render string, never the Line object */}
            {text}
          </div>
        )
      })}
    </div>
  )
})
