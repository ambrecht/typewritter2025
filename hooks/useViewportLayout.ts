"use client"

import { useEffect, useRef, useState } from "react"

/**
 * Calculates how many lines fit in the viewport without introducing scrollbars.
 * The calculation uses the current window height, a fixed header height and the
 * runtime height of the active line element.
 */
export function useViewportLayout(lineHeight: number) {
  const activeLineRef = useRef<HTMLDivElement>(null)
  const [maxVisibleLines, setMaxVisibleLines] = useState(20)

  useEffect(() => {
    const HEADER_HEIGHT = 40

    const update = () => {
      const viewportHeight = window.innerHeight
      const activeLineHeight = activeLineRef.current?.offsetHeight || 0
      const available = viewportHeight - HEADER_HEIGHT - activeLineHeight
      const lines = Math.floor(available / lineHeight)
      setMaxVisibleLines(Math.max(1, lines))
    }

    update()
    window.addEventListener("resize", update)

    const resizeObserver = new ResizeObserver(update)
    if (activeLineRef.current) resizeObserver.observe(activeLineRef.current)

    return () => {
      window.removeEventListener("resize", update)
      resizeObserver.disconnect()
    }
  }, [lineHeight])

  return { activeLineRef, maxVisibleLines }
}

