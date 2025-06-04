"use client"

import { useState, useEffect, useMemo } from "react"
import type { FormattedLine } from "@/types"

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
  lines: FormattedLine[],
  maxVisibleLines: number,
  mode: "typing" | "navigating",
  selectedLineIndex: number | null,
  isFullscreen = false,
) {
  const [isAndroid, setIsAndroid] = useState(false)
  const [useVirtualization, setUseVirtualization] = useState(false)

  // Refs für die letzte Berechnung und deren Parameter

  // Prüfe, ob es sich um ein Android-Gerät handelt
  useEffect(() => {
    const isAndroidDevice = navigator.userAgent.includes("Android")
    setIsAndroid(isAndroidDevice)

    // Im Vollbildmodus oder auf Android: Reduziere Virtualisierung für bessere Nutzung des Platzes
    // Aktiviere Virtualisierung nur bei sehr vielen Zeilen
    const threshold = isFullscreen ? 200 : isAndroidDevice ? 100 : 80
    setUseVirtualization(lines.length > threshold)
  }, [lines.length, isFullscreen])

  const calculateVisibleLines = useMemo(() => {
    const effectiveMaxVisibleLines = Math.max(20, maxVisibleLines)

    // Früher Return für leere Arrays
    if (lines.length === 0) return []

    let result
    if (!useVirtualization || lines.length <= effectiveMaxVisibleLines) {
      if (mode === "typing") {
        if (lines.length <= effectiveMaxVisibleLines) {
          result = lines.map((line, i) => ({ line, index: i, key: `${i}` }))
        } else {
          const start = Math.max(0, lines.length - effectiveMaxVisibleLines)
          result = lines.slice(start).map((line, i) => ({ line, index: start + i, key: `${start + i}` }))
        }
      } else {
        const visibleCount = Math.min(effectiveMaxVisibleLines, lines.length)
        const contextLines = Math.floor(visibleCount / 2)
        const start = Math.max(0, (selectedLineIndex ?? 0) - contextLines)
        const end = Math.min(lines.length - 1, start + visibleCount - 1)
        result = lines.slice(start, end + 1).map((line, i) => ({ line, index: start + i, key: `${start + i}` }))
      }
    } else {
      // Virtualisierung mit reduzierten Berechnungen
      if (mode === "navigating" && selectedLineIndex !== null) {
        const contextLines = isFullscreen ? 20 : isAndroid ? 15 : 10
        const visibleStart = Math.max(0, selectedLineIndex - contextLines)
        const visibleEnd = Math.min(lines.length - 1, selectedLineIndex + contextLines)
        result = lines
          .slice(visibleStart, visibleEnd + 1)
          .map((line, i) => ({ line, index: visibleStart + i, key: `${visibleStart + i}` }))
      } else {
        const visibleCount = Math.min(effectiveMaxVisibleLines, lines.length)
        if (lines.length <= visibleCount) {
          result = lines.map((line, i) => ({ line, index: i, key: `${i}` }))
        } else {
          const visibleStart = Math.max(0, lines.length - visibleCount)
          result = lines
            .slice(visibleStart)
            .map((line, i) => ({ line, index: visibleStart + i, key: `${visibleStart + i}` }))
        }
      }
    }

    return result
  }, [lines, maxVisibleLines, mode, selectedLineIndex, useVirtualization, isAndroid, isFullscreen])

  // Entferne die calculateVisibleLines Funktion und return direkt das Memo
  return calculateVisibleLines
}
