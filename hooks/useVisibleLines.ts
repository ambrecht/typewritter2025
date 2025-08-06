"use client"

import { useMemo } from "react"
import type { Line, FormattedLine } from "@/types"

export interface VisibleLine {
  line: FormattedLine
  index: number
  key: string
}

export function useVisibleLines(
  lines: Line[],
  maxVisibleLines: number,
  mode: "typing" | "navigating",
  selectedLineIndex: number | null,
  _isFullscreen: boolean,
): VisibleLine[] {
  return useMemo(() => {
    if (lines.length === 0) return []

    const visibleCount = Math.min(maxVisibleLines, lines.length)

    const buildResult = (start: number) =>
      lines.slice(start, start + visibleCount).map((line, idx) => ({
        line: { text: line.text },
        index: start + idx,
        key: String(line.id),
      }))

    if (mode === "typing") {
      const start = Math.max(0, lines.length - visibleCount)
      return buildResult(start)
    }

    const context = Math.floor(visibleCount / 2)
    const center = selectedLineIndex ?? 0
    let start = Math.max(0, center - context)
    if (start + visibleCount > lines.length) {
      start = Math.max(0, lines.length - visibleCount)
    }
    return buildResult(start)
  }, [lines, maxVisibleLines, mode, selectedLineIndex])
}
