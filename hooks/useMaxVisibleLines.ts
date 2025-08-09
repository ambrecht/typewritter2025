"use client"

import type React from "react"

import { useCallback, useEffect, useLayoutEffect, useState } from "react"

type Args = {
  rootRef: React.RefObject<HTMLElement | null>
  headerRef: React.RefObject<HTMLElement | null>
  lineMeasureEl?: HTMLElement | null
}

export function useMaxVisibleLines({ rootRef, headerRef, lineMeasureEl }: Args) {
  const [lineH, setLineH] = useState<number>(() => {
    const css = Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--lineHpx")) || 24
    return Math.max(16, Math.round(css))
  })
  const [N, setN] = useState<number>(0)

  function safeLineHeight(node: HTMLElement | null) {
    const target = node ?? rootRef.current
    if (!target) return lineH
    const cs = getComputedStyle(target)
    let lh = Number.parseFloat(cs.lineHeight)
    if (!Number.isFinite(lh) || lh <= 0) {
      const fs = Number.parseFloat(cs.fontSize) || 16
      lh = Math.round(fs * 1.2)
    }
    if (lh < 16) lh = 16
    return Math.round(lh)
  }

  const calc = useCallback(() => {
    const root = rootRef.current
    if (!root) return
    const vh = root.getBoundingClientRect().height
    const headRaw = headerRef.current?.getBoundingClientRect().height ?? 40
    const headH = Math.min(Math.max(headRaw, 40), Math.max(40, 0.1 * vh))
    const measured = safeLineHeight(lineMeasureEl ?? (document.getElementById("acl") as HTMLElement | null) ?? root)
    document.documentElement.style.setProperty("--lineHpx", `${measured}px`)
    const activeH = measured
    const avail = Math.max(0, vh - headH - activeH)
    const n = Math.max(0, Math.floor(avail / measured))
    setLineH(measured)
    setN(n)

    // Optional debug
    const dbg = document.getElementById("dbg")
    if (dbg) {
      dbg.textContent = JSON.stringify({ vh: Math.round(vh), headH: Math.round(headH), lineH: measured, N: n }, null, 2)
    }
  }, [headerRef, lineMeasureEl, rootRef])

  useLayoutEffect(() => {
    calc()
    // Recalc on font load as lineHeight may change when webfonts finish loading
    document.fonts?.ready?.then?.(calc).catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const onResize = () => calc()
    window.addEventListener("resize", onResize)
    window.addEventListener("orientationchange", onResize)
    return () => {
      window.removeEventListener("resize", onResize)
      window.removeEventListener("orientationchange", onResize)
    }
  }, [calc])

  return { lineH, maxVisible: N }
}
