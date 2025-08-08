"use client"

import { useLayoutEffect, useState, RefObject, useEffect } from "react"
import { useTypewriterStore } from "@/store/typewriter-store"

/**
 * Berechnet die maximale Anzahl sichtbarer Zeilen basierend auf der Viewport-Höhe
 * und der aktuellen Höhe des Eingabebereichs.
 */
export function useMaxVisibleLines(
  rootRef: RefObject<HTMLElement>,
  headerRef: RefObject<HTMLElement>,
  inputRef: RefObject<HTMLElement>,
) {
  const [state, setState] = useState({ max: 0, lineH: 0 })
  const setMaxVisibleLines = useTypewriterStore((s) => s.setMaxVisibleLines)

  useLayoutEffect(() => {
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
      const rootH = rootRef.current?.clientHeight ?? window.innerHeight
      const headerH = headerRef.current?.offsetHeight ?? 0
      const inputH = inputRef.current?.offsetHeight ?? 0
      const lineH = measureLineHeight()
      const max = Math.floor((rootH - headerH - inputH) / lineH)
      setState({ max, lineH })
      return { max, lineH }
    }

    calculate()

    const resizeObserver = new ResizeObserver(() => calculate())
    if (rootRef.current) resizeObserver.observe(rootRef.current)
    if (headerRef.current) resizeObserver.observe(headerRef.current)
    if (inputRef.current) resizeObserver.observe(inputRef.current)

    window.addEventListener("resize", calculate)
    window.addEventListener("orientationchange", calculate)

    return () => {
      resizeObserver.disconnect()
      window.removeEventListener("resize", calculate)
      window.removeEventListener("orientationchange", calculate)
    }
  }, [rootRef, headerRef, inputRef])

  useEffect(() => {
    setMaxVisibleLines(state.max)
  }, [state.max, setMaxVisibleLines])

  return state.lineH
}
