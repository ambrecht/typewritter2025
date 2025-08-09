"use client"

import { useMemo } from "react"
import type { Line } from "@/types"

/**
 * Compute the visible window:
 * - write mode: show the last maxVisible lines
 * - nav mode: show a window offset above the bottom
 * Offset counts how many lines above the bottom the window starts (clamped).
 */
export function useVisibleWindow(lines: Line[], maxVisible: number, mode: "write" | "nav", offset: number) {
  return useMemo(() => {
    if (!Array.isArray(lines) || lines.length === 0 || maxVisible <= 0) {
      return [] as { text: string; index: number; key: string }[]
    }

    const total = lines.length
    const count = Math.min(maxVisible, total)

    let startIndex: number
    if (mode === "nav") {
      const maxOffset = Math.max(total - count, 0)
      const clampedOffset = Math.max(0, Math.min(offset, maxOffset))
      startIndex = Math.max(total - count - clampedOffset, 0)
    } else {
      startIndex = Math.max(total - count, 0)
    }
    const end = Math.min(startIndex + count, total)
    const slice = lines.slice(startIndex, end)

    return slice.map((ln, i) => ({
      text: ln.text,
      index: startIndex + i,
      key: String(ln.id),
    }))
  }, [lines, maxVisible, mode, offset])
}
