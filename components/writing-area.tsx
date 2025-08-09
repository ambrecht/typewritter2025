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
      // Navigation: offset scrolls history upwards from the bottom window
      const start = Math.max(total - N - offset, 0)
      const end = Math.min(start + N, total)
      return lines.slice(start, end)
    }
  }, [lines, maxVisibleLines, mode, offset])

  const lineHeight = isFullscreen ? 1.3 : 1.4

  return (
    <div
      ref={linesContainerRef as any}
      className={`line-stack ${darkMode ? "bg-[#121212]" : "bg-[#f3efe9]"} w-full h-full overflow-hidden`}
      style={{
        fontFamily: "ui-serif, Georgia, Cambria, 'Times New Roman', Times, serif",
        fontSize: `${stackFontSize}px`,
        lineHeight: String(lineHeight),
        padding: "0.75rem 1.25rem",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start", // anchor to top in all modes
        gap: "0px",
      }}
      aria-label="Line stack"
    >
      {visible.map((l) => (
        <div
          key={l.id}
          className={`${darkMode ? "text-[#E0E0E0]" : "text-[#222]"} truncate`}
          style={{ whiteSpace: "nowrap" }}
        >
          {l.text}
        </div>
      ))}
      {/* Fillers are not needed; we clip strictly to the container height */}
    </div>
  )
}
