"use client"

import type React from "react"
import { useMemo, useCallback } from "react"
import { cn } from "@/lib/utils"
import { LineStack, type VisibleLine } from "@/components/writing-area/LineStack"
import type { Line } from "@/types"

type Mode = "write" | "nav"

interface WritingAreaProps {
  lines: Line[]
  darkMode: boolean
  stackFontSize: number
  lineHeightPx: number
  mode: Mode
  offset: number
  maxVisibleLines: number
  containerRef?: React.RefObject<HTMLDivElement>
}

/**
 * Middle "paper" card that strictly clips the line window.
 * - No scrolling. Only the last N lines are rendered (windowing).
 * - Newest visible line sits at the bottom (directly above the ACL).
 * - No ActiveLine here — the ACL is rendered in app/page.tsx at the bottom.
 */
export default function WritingArea({
  lines,
  darkMode,
  stackFontSize,
  lineHeightPx,
  mode,
  offset,
  maxVisibleLines,
  containerRef,
}: WritingAreaProps) {
  const { visible, selectedGlobalIndex } = useMemo(() => {
    const total = lines.length
    const end = Math.max(0, Math.min(total, total - Math.max(0, offset)))
    const n = Math.max(0, maxVisibleLines)
    const start = Math.max(0, end - n)

    const windowSlice = lines.slice(start, end)
    const visibleLines: VisibleLine[] = windowSlice.map((l, i) => ({
      text: l.text,
      index: start + i,
      key: `${l.id}-${start + i}`,
    }))

    const sel = mode === "nav" && visibleLines.length > 0 ? visibleLines[visibleLines.length - 1].index : null

    return { visible: visibleLines, selectedGlobalIndex: sel }
  }, [lines, maxVisibleLines, offset, mode])

  const copyAll = useCallback(async () => {
    try {
      const content = lines.map((l) => l.text).join("\n")
      await navigator.clipboard.writeText(content)
    } catch (e) {
      console.warn("Copy failed", e)
    }
  }, [lines])

  return (
    <div
      className={cn(
        // Added bottom padding so the ACL below has breathing room, no overlap.
        "h-full w-full px-4 sm:px-6 md:px-8 pb-3 sm:pb-4",
        darkMode ? "bg-transparent" : "bg-transparent",
      )}
      aria-label="Writing area"
    >
      <div
        className={cn(
          "relative h-full w-full rounded-xl border shadow-lg",
          darkMode
            ? "bg-[#171717] border-neutral-800 shadow-black/40"
            : "bg-white border-[#e9e5dd] shadow-[0_1px_0_rgba(0,0,0,0.04),0_30px_60px_-15px_rgba(0,0,0,0.18)]",
        )}
      >
        {/* Subtle top glow like paper */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-3 rounded-t-xl bg-gradient-to-b from-black/5 to-transparent" />

        {/* Copy button (top-right), optional */}
        <button
          type="button"
          onClick={copyAll}
          className={cn(
            "absolute right-3 top-3 inline-flex items-center justify-center rounded-md border text-xs h-8 w-8",
            darkMode
              ? "bg-[#202020] border-neutral-700 hover:bg-[#262626]"
              : "bg-white border-neutral-200 hover:bg-neutral-50",
          )}
          aria-label="Alles kopieren"
          title="Alles kopieren"
        >
          <svg
            className={cn(darkMode ? "text-neutral-200" : "text-neutral-700")}
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
          >
            <path d="M8 8h12v12H8z" stroke="currentColor" strokeWidth="1.5" />
            <path d="M4 4h12v12" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </button>

        {/* Content area: strictly clipped; newest visible lines sit at the bottom */}
        <div
          ref={containerRef}
          className="absolute inset-0 overflow-hidden"
          style={{
            paddingLeft: "2rem",
            paddingRight: "2rem",
            paddingTop: "1.25rem",
            // Slightly larger bottom padding to emphasize separation from ACL
            paddingBottom: "0.75rem",
          }}
        >
          <LineStack
            visibleLines={visible}
            lineHeightPx={lineHeightPx}
            fontSizePx={stackFontSize}
            selectedGlobalIndex={selectedGlobalIndex}
          />
        </div>
      </div>
    </div>
  )
}
