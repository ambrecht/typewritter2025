"use client"

import { useMemo } from "react"
import type { Line } from "@/types"

/**
 * Hook zur Berechnung der sichtbaren Zeilen basierend auf einem Offset.
 *
 * @param allLines - Array aller Zeilen
 * @param maxVisibleLines - Maximale Anzahl sichtbarer Zeilen
 * @param offset - Offset vom Ende des Stapels
 * @returns Sichtbare Zeilen mit ihren globalen Indizes
 */
export function useVisibleLines(
  allLines: Line[],
  maxVisibleLines: number,
  offset: number,
) {
  return useMemo(() => {
    const start = Math.max(allLines.length - maxVisibleLines - offset, 0)
    return allLines
      .slice(start, start + maxVisibleLines)
      .map((line, i) => ({ line, index: start + i }))
  }, [allLines, maxVisibleLines, offset])
}
