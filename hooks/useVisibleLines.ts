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
        result = lines
          .slice(start, end + 1)
          .map((line, idx) => ({ line, index: start + idx }))
      }
    } else {
      if (mode === "navigating" && selectedLineIndex !== null) {
        const contextLines = isFullscreen ? 20 : isAndroid ? 15 : 10
        const visibleStart = Math.max(0, selectedLineIndex - contextLines)
        const visibleEnd = Math.min(lines.length - 1, selectedLineIndex + contextLines)
        result = lines
          .slice(visibleStart, visibleEnd + 1)
          .map((line, idx) => ({ line, index: visibleStart + idx }))
      } else {
        const visibleCount = Math.min(maxVisibleLines, lines.length)
        if (lines.length <= visibleCount) {
          result = lines.map((line, index) => ({ line, index }))
        } else {
          const visibleStart = Math.max(0, lines.length - visibleCount)
          result = lines
            .slice(visibleStart)
            .map((line, idx) => ({ line, index: visibleStart + idx }))
        }
      }
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
