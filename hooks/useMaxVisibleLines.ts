"use client"

import { useLayoutEffect, useState, RefObject } from "react"

/**
 * Berechnet die maximale Anzahl sichtbarer Zeilen basierend auf der Viewport-Höhe
 * und der aktuellen Höhe des Eingabebereichs.
 */
export function useMaxVisibleLines(
  inputRef: RefObject<HTMLElement>,
  lineHeight: number,
) {
  const [maxVisible, setMaxVisible] = useState(0)

  useLayoutEffect(() => {
    const HEADER_HEIGHT = 40

    const resize = () => {
      const vh = window.innerHeight
      const inputH = inputRef.current?.offsetHeight ?? 0
      setMaxVisible(Math.floor((vh - HEADER_HEIGHT - inputH) / lineHeight))
    }

    resize()
    window.addEventListener("resize", resize)
    return () => window.removeEventListener("resize", resize)
  }, [inputRef, lineHeight])

  return maxVisible
}
