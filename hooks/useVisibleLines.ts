"use client"

import { useState, useEffect, useMemo } from "react"

/**
 * Hook zur Berechnung der sichtbaren Zeilen mit Virtualisierung für bessere Performance
 * Besonders wichtig für leistungsschwächere Android-Geräte
 *
 * @param lines - Array aller Zeilen
 * @param maxVisibleLines - Maximale Anzahl sichtbarer Zeilen
 * @param mode - Aktueller Modus (typing oder navigating)
 * @param selectedLineIndex - Index der ausgewählten Zeile im Navigationsmodus
 * @param isFullscreen - Ob der Vollbildmodus aktiv ist
 * @returns Die aktuell sichtbaren Zeilen mit IDs
 */
export interface VisibleLine {
  id: number
  text: string
}

export function useVisibleLines(
  lines: string[],
  maxVisibleLines: number,
  mode: "typing" | "navigating",
  selectedLineIndex: number | null,
  isFullscreen = false,
): VisibleLine[] {
  const [isAndroid, setIsAndroid] = useState(false)
  const [useVirtualization, setUseVirtualization] = useState(false)

  useEffect(() => {
    const isAndroidDevice = navigator.userAgent.includes("Android")
    setIsAndroid(isAndroidDevice)
    const threshold = isFullscreen ? 200 : isAndroidDevice ? 100 : 80
    setUseVirtualization(lines.length > threshold)
  }, [lines.length, isFullscreen])

  const calculateVisibleLines = useMemo(() => {
    const effectiveMaxVisibleLines = Math.max(20, maxVisibleLines)

    if (lines.length === 0) return []

    let start = 0
    let end = lines.length - 1

    if (!useVirtualization || lines.length <= effectiveMaxVisibleLines) {
      if (mode === "typing") {
        if (lines.length > effectiveMaxVisibleLines) {
          start = Math.max(0, lines.length - effectiveMaxVisibleLines)
        }
        end = lines.length - 1
      } else {
        const visibleCount = Math.min(effectiveMaxVisibleLines, lines.length)
        const contextLines = Math.floor(visibleCount / 2)
        start = Math.max(0, (selectedLineIndex ?? 0) - contextLines)
        end = Math.min(lines.length - 1, start + visibleCount - 1)
      }
    } else {
      if (mode === "navigating" && selectedLineIndex !== null) {
        const contextLines = isFullscreen ? 20 : isAndroid ? 15 : 10
        start = Math.max(0, selectedLineIndex - contextLines)
        end = Math.min(lines.length - 1, selectedLineIndex + contextLines)
      } else {
        const visibleCount = Math.min(effectiveMaxVisibleLines, lines.length)
        if (lines.length > visibleCount) {
          start = Math.max(0, lines.length - visibleCount)
        }
        end = Math.min(lines.length - 1, start + visibleCount - 1)
      }
    }

    return lines.slice(start, end + 1).map((text, i) => ({ id: start + i, text }))
  }, [lines, maxVisibleLines, mode, selectedLineIndex, useVirtualization, isAndroid, isFullscreen])

  return calculateVisibleLines
}
