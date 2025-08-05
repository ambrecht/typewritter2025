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
 * @returns Die aktuell sichtbaren Zeilen
 */
export function useVisibleLines(
  lines: string[],
  maxVisibleLines: number,
  mode: "typing" | "navigating",
  selectedLineIndex: number | null,
  isFullscreen = false,
) {
  const [isAndroid, setIsAndroid] = useState(false)
  const [useVirtualization, setUseVirtualization] = useState(false)

  useEffect(() => {
    const isAndroidDevice = navigator.userAgent.includes("Android")
    setIsAndroid(isAndroidDevice)
    const threshold = isFullscreen ? 200 : isAndroidDevice ? 100 : 80
    setUseVirtualization(lines.length > threshold)
  }, [lines.length, isFullscreen])

  const calculateVisibleLines = useMemo(() => {
    if (lines.length === 0) return []

    let result
    if (!useVirtualization || lines.length <= maxVisibleLines) {
      if (mode === "typing") {
        if (lines.length <= maxVisibleLines) {
          result = lines
        } else {
          const start = Math.max(0, lines.length - maxVisibleLines)
          result = lines.slice(start)
        }
      } else {
        const visibleCount = Math.min(maxVisibleLines, lines.length)
        const contextLines = Math.floor(visibleCount / 2)
        const start = Math.max(0, (selectedLineIndex ?? 0) - contextLines)
        const end = Math.min(lines.length - 1, start + visibleCount - 1)
        result = lines.slice(start, end + 1)
      }
    } else {
      if (mode === "navigating" && selectedLineIndex !== null) {
        const contextLines = isFullscreen ? 20 : isAndroid ? 15 : 10
        const visibleStart = Math.max(0, selectedLineIndex - contextLines)
        const visibleEnd = Math.min(lines.length - 1, selectedLineIndex + contextLines)
        result = lines.slice(visibleStart, visibleEnd + 1)
      } else {
        const visibleCount = Math.min(maxVisibleLines, lines.length)
        if (lines.length <= visibleCount) {
          result = lines
        } else {
          const visibleStart = Math.max(0, lines.length - visibleCount)
          result = lines.slice(visibleStart)
        }
      }
    }

    return result
  }, [lines, maxVisibleLines, mode, selectedLineIndex, useVirtualization, isAndroid, isFullscreen])

  return calculateVisibleLines
}
