"use client"

import type React from "react"
import { useMemo } from "react"
import { useTypewriterStore } from "@/store/typewriter-store"

type Mode = "write" | "nav"

interface WritingAreaProps {
  lines: { id: string; text: string }[]
  stackFontSize: number
  darkMode: boolean
  mode: Mode
  offset: number
  isFullscreen: boolean
  linesContainerRef: React.RefObject<HTMLDivElement | null>
}

/**
 * LineStack/History viewport:
 * - Anchored to top
 * - Clipped (overflow hidden)
 * - Renders only last N lines in write mode, or a window shifted by offset in nav mode
 */
export default function WritingArea({
  lines,
  stackFontSize,
  darkMode,
  mode,
  offset,
  isFullscreen,
  linesContainerRef,
}: WritingAreaProps) {
  const maxVisibleLines = useTypewriterStore((s) => s.maxVisibleLines)

  const visible = useMemo(() => {
    const total = lines.length
    const N = Math.max(0, maxVisibleLines)
    if (N === 0) return []
    if (mode === "write") {
      const start = Math.max(total - N, 0)
      return lines.slice(start, total)
    } else {
      const start = Math.max(total - N - offset, 0)
      const end = Math.min(start + N, total)
      return lines.slice(start, end)
    }
  }, [lines, maxVisibleLines, mode, offset])

  const lineHeight = isFullscreen ? 1.3 : 1.4

  return (
    <div
      ref={linesContainerRef as any}
      className={`w-full h-full overflow-hidden ${darkMode ? "bg-[#121212]" : "bg-[#f3efe9]"} font-serif`}
      style={{
        fontSize: `${stackFontSize}px`,
        lineHeight: String(lineHeight),
        padding: "0.75rem 1.25rem",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
        gap: "0px",
      }}
      aria-label="Line stack"
    >
      {visible.map((l, idx) => (
        <div
          key={l.id}
          data-line-index={idx}
          className={`${darkMode ? "text-[#E0E0E0]" : "text-[#222]"}`}
          style={{ whiteSpace: "nowrap", overflow: "hidden" }}
        >
          {l.text}
        </div>
      ))}
    </div>
  )
}
