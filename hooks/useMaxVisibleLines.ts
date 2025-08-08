"use client"

import { useLayoutEffect, useState, RefObject } from "react"
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
  const [lineH, setLineH] = useState(0)
  const setMaxVisibleLines = useTypewriterStore((s) => s.setMaxVisibleLines)

  useLayoutEffect(() => {
    const clamp = (value: number, min: number, max: number) =>
      Math.max(min, Math.min(value, max))

    const sample = document.createElement("div")
    sample.style.position = "absolute"
    sample.style.visibility = "hidden"
    sample.style.pointerEvents = "none"
    sample.textContent = "M"
    rootRef.current?.appendChild(sample)

    const measureLineHeight = () => {
      const inputEl = inputRef.current
      if (inputEl) {
        const computed = window.getComputedStyle(inputEl)
        sample.style.font = computed.font
        sample.style.lineHeight = computed.lineHeight
      }
      return sample.getBoundingClientRect().height || 1
    }

    const calculate = () => {
      const vh = rootRef.current?.getBoundingClientRect().height ?? window.innerHeight
      const rawHeaderH = headerRef.current?.offsetHeight ?? 0
      const headH = clamp(rawHeaderH, 40, 0.1 * vh)
      const lineHeight = measureLineHeight()
      const maxVisible = Math.max(0, Math.floor((vh - headH - lineHeight) / lineHeight))

      setLineH(lineHeight)
      if (rootRef.current)
        rootRef.current.style.setProperty("--lineHpx", `${lineHeight}px`)
      setMaxVisibleLines(maxVisible)
    }

    calculate()

    const resizeObserver = new ResizeObserver(calculate)
    if (rootRef.current) resizeObserver.observe(rootRef.current)
    if (headerRef.current) resizeObserver.observe(headerRef.current)
    if (inputRef.current) resizeObserver.observe(inputRef.current)
    resizeObserver.observe(sample)

    window.addEventListener("resize", calculate)
    window.addEventListener("orientationchange", calculate)

    return () => {
      resizeObserver.disconnect()
      window.removeEventListener("resize", calculate)
      window.removeEventListener("orientationchange", calculate)
      sample.remove()
    }
  }, [rootRef, headerRef, inputRef, setMaxVisibleLines])

  return lineH
}
