"use client"

import { useLayoutEffect, useState, RefObject, useEffect } from "react"
import { useTypewriterStore } from "@/store/typewriter-store"

/**
 * Berechnet die maximale Anzahl sichtbarer Zeilen basierend auf der Viewport-Höhe
 * und der aktuellen Höhe des Eingabebereichs.
 */
export function useMaxVisibleLines(
  inputRef: RefObject<HTMLElement>,
  ) {
  const [maxVisible, setMaxVisible] = useState(0)
  const setMaxVisibleLines = useTypewriterStore((state) => state.setMaxVisibleLines)

  useLayoutEffect(() => {
    const HEADER_HEIGHT = 40
    const measureLineHeight = () => {
      const sample = document.createElement("div")
      sample.style.position = "absolute"
      sample.style.visibility = "hidden"
      sample.style.pointerEvents = "none"
      sample.textContent = "M"

      const inputEl = inputRef.current
      if (inputEl) {
        const computed = window.getComputedStyle(inputEl)
        sample.style.font = computed.font
        sample.style.lineHeight = computed.lineHeight
      }

      document.body.appendChild(sample)
      const height = sample.getBoundingClientRect().height || 1
      document.body.removeChild(sample)
      return height
    }

    const calculate = () => {
      const vh = window.innerHeight
      const inputH = inputRef.current?.offsetHeight ?? 0
      const lineHeight = measureLineHeight()
      const max = Math.floor((vh - HEADER_HEIGHT - inputH) / lineHeight)
      setMaxVisible(max)
      return max
    }

    calculate()

    const element = inputRef.current
    const observer = new ResizeObserver(() => calculate())
    if (element) observer.observe(element)

    window.addEventListener("resize", calculate)
    window.addEventListener("orientationchange", calculate)

    return () => {
      window.removeEventListener("resize", calculate)
      window.removeEventListener("orientationchange", calculate)
      if (element) observer.unobserve(element)
      observer.disconnect()
    }
  }, [inputRef])

  useEffect(() => {
    setMaxVisibleLines(maxVisible)
  }, [maxVisible, setMaxVisibleLines])

  return maxVisible
}
