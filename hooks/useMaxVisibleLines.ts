"use client"

import { useLayoutEffect, useState, RefObject, useEffect } from "react"
import { useTypewriterStore } from "@/store/typewriter-store"

/**
 * Berechnet die maximale Anzahl sichtbarer Zeilen basierend auf der Viewport-Höhe
 * und der aktuellen Höhe des Eingabebereichs.
 */
export function useMaxVisibleLines(
  inputRef: RefObject<HTMLElement>,
  lineHeight: number,
  ) {
  const [maxVisible, setMaxVisible] = useState(0)
  const setMaxVisibleLines = useTypewriterStore((state) => state.setMaxVisibleLines)

  useLayoutEffect(() => {
    const HEADER_HEIGHT = 40
    const calculate = () => {
      const vh = window.innerHeight
      const inputH = inputRef.current?.offsetHeight ?? 0
      setMaxVisible(Math.floor((vh - HEADER_HEIGHT - inputH) / lineHeight))
    }

    calculate()

    const element = inputRef.current
    const observer = new ResizeObserver(() => calculate())
    if (element) observer.observe(element)

    window.addEventListener("resize", calculate)

    return () => {
      window.removeEventListener("resize", calculate)
      if (element) observer.unobserve(element)
      observer.disconnect()
    }
  }, [inputRef, lineHeight])

  useEffect(() => {
    setMaxVisibleLines(maxVisible)
  }, [maxVisible, setMaxVisibleLines])

  return maxVisible
}
