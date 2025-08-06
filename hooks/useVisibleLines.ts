"use client"

import { useMemo } from "react"

/**
 * Hook zur Berechnung der sichtbaren Zeilen.
 *
 * - Im Tippmodus werden einfach die letzten `maxVisibleLines` Zeilen zurückgegeben.
 * - Im Navigationsmodus wird ein Fenster von `maxVisibleLines` Zeilen um den
 *   `selectedLineIndex` zentriert zurückgegeben.
 */
export interface VisibleLine {
  id: number
  text: string
}

export function useVisibleLines(
  allLines: Line[],
  maxVisibleLines: number,
  mode: "typing" | "navigating",
  selectedLineIndex: number | null,
) {
  return useMemo(() => {
    if (mode === "typing" || selectedLineIndex === null) {
      return lines.slice(-maxVisibleLines)
    }

    const half = Math.floor(maxVisibleLines / 2)
    const maxStart = Math.max(0, lines.length - maxVisibleLines)
    let start = selectedLineIndex - half
    if (start < 0) start = 0
    if (start > maxStart) start = maxStart
    const end = start + maxVisibleLines

    return lines.slice(start, end)
  }, [lines, maxVisibleLines, mode, selectedLineIndex])
}
