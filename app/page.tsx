"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { useTypewriterStore } from "@/store/typewriter-store"
import WritingArea from "@/components/writing-area"
import ControlBar from "@/components/control-bar"
import OptionsBar from "@/components/options-bar"
import ActiveInput from "@/components/active-input"
import { ActiveLine } from "@/components/writing-area/ActiveLine"
import OfflineIndicator from "@/components/offline-indicator"
import SaveNotification from "@/components/save-notification"
import SettingsModal from "@/components/settings-modal"
import FlowSettingsModal from "@/components/flow-settings-modal"
import FlowModeOverlay from "@/components/flow-mode-overlay"
import ApiKeyWarning from "@/components/api-key-warning"
import { measureTextWidth } from "@/utils/canvas-utils"

// Fixed top bar height in px (per spec: e.g. 40px)
const HEAD_H = 40

export default function TypewriterPage() {
  const {
    // state
    lines,
    activeLine,
    statistics,
    fontSize,
    stackFontSize,
    darkMode,
    mode,
    offset,
    maxVisibleLines,
    // actions
    setMode,
    adjustOffset,
    resetNavigation,
    handleKeyPress,
    setContainerWidth,
    setMaxVisibleLines,
    setTextMetrics,
  } = useTypewriterStore()

  const WORD_GOAL = 750
  const progress = Math.max(0, Math.min(1, statistics.wordCount / WORD_GOAL))

  const viewportRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)
  const activeLineRef = useRef<HTMLDivElement>(null)
  const hiddenInputRef = useRef<HTMLTextAreaElement>(null)
  const linesContainerRef = useRef<HTMLDivElement>(null)

  const pressedKeysRef = useRef<Set<string>>(new Set())
  const lastKeyRef = useRef<{ key: string; time: number }>({ key: "", time: 0 })

  const [showCursor, setShowCursor] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isAndroid, setIsAndroid] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showFlowSettings, setShowFlowSettings] = useState(false)

  // ACL height equals a single line height in px
  const [lineHeightPx, setLineHeightPx] = useState<number>(Math.round(stackFontSize * 1.4))

  const focusInput = useCallback(() => {
    const el = hiddenInputRef.current
    if (el) {
      el.focus()
      const len = el.value.length
      try {
        el.setSelectionRange(len, len)
      } catch {}
    }
  }, [])

  useEffect(() => {
    const t = setInterval(() => setShowCursor((p) => !p), 530)
    return () => clearInterval(t)
  }, [])

  const openSettings = useCallback(() => setShowSettings(true), [])
  const openFlowSettings = useCallback(() => setShowFlowSettings(true), [])
  const closeSettings = useCallback(() => {
    setShowSettings(false)
    setTimeout(focusInput, 200)
  }, [focusInput])
  const closeFlowSettings = useCallback(() => {
    setShowFlowSettings(false)
    setTimeout(focusInput, 200)
  }, [focusInput])

  useEffect(() => {
    if (mode === "write") focusInput()
  }, [mode, focusInput])

  // Height and text metrics calculation
  useEffect(() => {
    function measureLineHeightPx(fontPx: number, factor = 1.4) {
      const sample = document.createElement("div")
      sample.style.position = "absolute"
      sample.style.left = "-9999px"
      sample.style.top = "0"
      sample.style.visibility = "hidden"
      sample.style.pointerEvents = "none"
      sample.style.whiteSpace = "nowrap"
      sample.style.fontFamily = 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif'
      sample.style.fontSize = `${fontPx}px`
      sample.style.lineHeight = String(factor)
      sample.textContent = "M"
      document.body.appendChild(sample)
      const h = Math.max(16, Math.round(sample.getBoundingClientRect().height || fontPx * 1.2))
      document.body.removeChild(sample)
      return h
    }

    const recalc = () => {
      const vh = viewportRef.current?.getBoundingClientRect().height ?? window.innerHeight

      // line height and ACL height
      const lh = measureLineHeightPx(stackFontSize, isFullscreen ? 1.3 : 1.4)
      setLineHeightPx(lh)
      // Only the ACL’s inner content width is relevant for wrapping
      if (activeLineRef.current) {
        const contentWidth = activeLineRef.current.clientWidth
        setContainerWidth(contentWidth)

        // approximate avg grapheme width to compute maxAutoCols
        const font = `${fontSize}px "Lora", serif`
        const probe = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
        const width = measureTextWidth(probe, font)
        const graphemes = new Intl.Segmenter("de", { granularity: "grapheme" })
        const count = Array.from(graphemes.segment(probe)).length || probe.length
        const avgGraphemeWidth = count > 0 ? width / count : Math.max(1, fontSize * 0.6)
        const maxAutoCols = Math.max(1, Math.floor(contentWidth / Math.max(1, avgGraphemeWidth)))
        setTextMetrics({ avgGraphemeWidth, maxAutoCols })
      }

      // Compute how many lines fit: N = floor((vh - HEAD_H - lineH)/lineH)
      const available = Math.max(0, vh - HEAD_H - lh)
      const N = Math.max(0, Math.floor(available / lh))
      setMaxVisibleLines(N)
    }

    const roViewport = new ResizeObserver(recalc)
    const roACL = new ResizeObserver(recalc)
    if (viewportRef.current) roViewport.observe(viewportRef.current)
    if (activeLineRef.current) roACL.observe(activeLineRef.current)

    window.addEventListener("resize", recalc)
    window.addEventListener("orientationchange", recalc)
    document.fonts?.ready?.then(recalc).catch(() => {})
    recalc()

    return () => {
      roViewport.disconnect()
      roACL.disconnect()
      window.removeEventListener("resize", recalc)
      window.removeEventListener("orientationchange", recalc)
    }
  }, [fontSize, stackFontSize, isFullscreen, setContainerWidth, setMaxVisibleLines, setTextMetrics])

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      viewportRef.current?.requestFullscreen().catch((err) => console.error("Fullscreen error:", err))
    } else {
      document.exitFullscreen().catch((err) => console.error("Exit fullscreen error:", err))
    }
  }, [])

  useEffect(() => {
    const onFull = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener("fullscreenchange", onFull)
    return () => document.removeEventListener("fullscreenchange", onFull)
  }, [])

  useEffect(() => {
    const isAndroidDevice = /Android/.test(navigator.userAgent)
    setIsAndroid(isAndroidDevice)
    if (isAndroidDevice) document.body.classList.add("android-typewriter")
  }, [])

  // Global keyboard handling per spec (no scrolling; windowing only)
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        event.repeat ||
        event.isComposing ||
        (event as any).keyCode === 229 ||
        pressedKeysRef.current.has(event.key)
      ) {
        return
      }
      pressedKeysRef.current.add(event.key)

      const target = event.target as HTMLElement
      if (target.closest('[role="dialog"], .settings-panel, input, textarea:not(#hidden-input)')) {
        return
      }

      const now = Date.now()
      if (event.key === lastKeyRef.current.key && now - lastKeyRef.current.time < 40) {
        return
      }
      lastKeyRef.current = { key: event.key, time: now }

      if (event.key === "Escape") {
        event.preventDefault()
        resetNavigation()
        focusInput()
        return
      }

      if (event.key === "ArrowUp" || event.key === "ArrowDown") {
        event.preventDefault()
        if (mode !== "nav") setMode("nav")
        // Up: older lines => increase offset within [0..max]
        adjustOffset(event.key === "ArrowUp" ? 1 : -1)
        return
      }

      const isTypingKey = event.key.length === 1 || event.key === "Backspace" || event.key === "Enter"
      if (mode === "nav" && isTypingKey) {
        event.preventDefault()
        resetNavigation()
        handleKeyPress(event.key)
        return
      }

      if (isTypingKey) {
        event.preventDefault()
        handleKeyPress(event.key)
      }
    }
    const onKeyUp = (event: KeyboardEvent) => {
      pressedKeysRef.current.delete(event.key)
    }
    document.addEventListener("keydown", onKeyDown)
    document.addEventListener("keyup", onKeyUp)
    return () => {
      document.removeEventListener("keydown", onKeyDown)
      document.removeEventListener("keyup", onKeyUp)
    }
  }, [mode, adjustOffset, handleKeyPress, resetNavigation, setMode, focusInput])

  const onRootClick = useCallback(() => {
    if (mode === "nav") resetNavigation()
    focusInput()
  }, [mode, resetNavigation, focusInput])

  return (
    <div
      ref={viewportRef}
      className={`h-[100svh] w-[100vw] flex flex-col ${
        darkMode ? "dark bg-[#121212] text-[#E0E0E0]" : "bg-[#f3efe9] text-gray-900"
      } overflow-hidden`}
      tabIndex={-1}
      onClick={onRootClick}
      aria-label="Typewriter viewport"
    >
      <ApiKeyWarning />

      {/* Fixed-height OptionsBar (always visible, no sticky overlay) */}
      <OptionsBar ref={headerRef} className="h-[40px]" data-testid="options-bar">
        <ControlBar
          wordCount={statistics.wordCount}
          pageCount={statistics.pageCount}
          toggleFullscreen={toggleFullscreen}
          hiddenInputRef={hiddenInputRef}
          isFullscreen={isFullscreen}
          openSettings={openSettings}
          openFlowSettings={openFlowSettings}
        />
      </OptionsBar>

      {/* Middle: strictly clipped window (no scrollbars) */}
      <div className="flex-1 overflow-hidden">
        <WritingArea
          lines={lines}
          darkMode={darkMode}
          stackFontSize={stackFontSize}
          lineHeightPx={lineHeightPx}
          mode={mode as "write" | "nav"}
          offset={offset}
          maxVisibleLines={maxVisibleLines}
          containerRef={linesContainerRef}
        />
      </div>

      {/* Bottom: Active Compose Line (exactly one line tall, visually separated) */}
      <ActiveInput className="shrink-0" data-testid="acl-wrapper">
        <ActiveLine
          activeLine={activeLine}
          darkMode={darkMode}
          fontSize={fontSize}
          lineHeightPx={lineHeightPx}
          showCursor={showCursor}
          // legacy counter; wrapping logic is pixel-based in the store
          maxCharsPerLine={9999}
          hiddenInputRef={hiddenInputRef}
          activeLineRef={activeLineRef}
          isAndroid={isAndroid}
          progress={progress}
        />
      </ActiveInput>

      <SaveNotification />
      <FlowModeOverlay />
      <OfflineIndicator darkMode={darkMode} />
      <SettingsModal isOpen={showSettings} onClose={closeSettings} darkMode={darkMode} />
      <FlowSettingsModal isOpen={showFlowSettings} onClose={closeFlowSettings} darkMode={darkMode} />
    </div>
  )
}
