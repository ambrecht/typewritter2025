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

export default function TypewriterPage() {
  const {
    lines,
    activeLine,
    maxCharsPerLine,
    statistics,
    fontSize,
    stackFontSize,
    darkMode,
    mode,
    offset,
    setMode,
    adjustOffset,
    resetNavigation,
    handleKeyPress,
    setContainerWidth,
    setMaxVisibleLines,
    setTextMetrics,
  } = useTypewriterStore()

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

  // ACL is exactly 1 line high
  const [activeLineHeight, setActiveLineHeight] = useState<number>(Math.round(fontSize * 1.4))

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

  // Blink cursor
  useEffect(() => {
    const t = setInterval(() => setShowCursor((p) => !p), 530)
    return () => clearInterval(t)
  }, [])

  const openFlowSettings = useCallback(() => setShowFlowSettings(true), [])
  const openSettings = useCallback(() => setShowSettings(true), [])
  const closeSettings = useCallback(() => {
    setShowSettings(false)
    setTimeout(focusInput, 250)
  }, [focusInput])
  const closeFlowSettings = useCallback(() => {
    setShowFlowSettings(false)
    setTimeout(focusInput, 250)
  }, [focusInput])

  // Focus when returning to write mode
  useEffect(() => {
    if (mode === "write") focusInput()
  }, [mode, focusInput])

  // Compute line heights, maxVisibleLines, containerWidth, avgGraphemeWidth, maxAutoCols
  useEffect(() => {
    const measureLineHeight = (fontPx: number, factor: number) => {
      const sample = document.createElement("div")
      sample.style.position = "absolute"
      sample.style.visibility = "hidden"
      sample.style.pointerEvents = "none"
      sample.style.whiteSpace = "nowrap"
      sample.style.fontFamily = "ui-serif, Georgia, Cambria, 'Times New Roman', Times, serif"
      sample.style.fontSize = `${fontPx}px`
      sample.style.lineHeight = String(factor)
      sample.textContent = "M"
      document.body.appendChild(sample)
      const h = sample.getBoundingClientRect().height || Math.max(1, fontPx * factor)
      document.body.removeChild(sample)
      return h
    }

    const recalc = () => {
      const vh = window.innerHeight
      const headerH = Math.max(40, Math.min(vh * 0.1, headerRef.current?.offsetHeight ?? 40))
      const factor = isFullscreen ? 1.3 : 1.4
      const stackLineH = measureLineHeight(stackFontSize, factor)
      const aclH = measureLineHeight(fontSize, factor)
      const availableForStack = Math.max(vh - headerH - aclH, 0)
      const maxLines = Math.max(Math.floor(availableForStack / stackLineH), 0)
      setMaxVisibleLines(maxLines)
      setActiveLineHeight(Math.round(aclH))

      // Available width for the ACL (content width)
      if (activeLineRef.current) {
        const contentWidth = activeLineRef.current.clientWidth
        setContainerWidth(contentWidth)

        // Compute avg grapheme width in current font
        const font = `${fontSize}px "Lora", serif`
        const sampleText = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
        const sampleWidth = measureTextWidth(sampleText, font)
        const graphemes = new Intl.Segmenter("de", { granularity: "grapheme" })
        const count = Array.from(graphemes.segment(sampleText)).length || sampleText.length
        const avg = count > 0 ? sampleWidth / count : Math.max(1, fontSize * 0.6)
        const maxAutoCols = Math.max(1, Math.floor(contentWidth / Math.max(1, avg)))
        setTextMetrics({ avgGraphemeWidth: avg, maxAutoCols })
      }
    }

    const roHeader = new ResizeObserver(recalc)
    const roACL = new ResizeObserver(recalc)
    if (headerRef.current) roHeader.observe(headerRef.current)
    if (activeLineRef.current) roACL.observe(activeLineRef.current)
    window.addEventListener("resize", recalc)
    window.addEventListener("orientationchange", recalc)
    recalc()

    return () => {
      roHeader.disconnect()
      roACL.disconnect()
      window.removeEventListener("resize", recalc)
      window.removeEventListener("orientationchange", recalc)
    }
  }, [fontSize, stackFontSize, isFullscreen, setMaxVisibleLines, setContainerWidth, setTextMetrics])

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

  // Global keyboard handling (Up/Down -> nav, Esc to exit, typing exits nav)
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
    >
      <ApiKeyWarning />

      {/* OptionsBar: 100vw wide, min 40px, max 10vh */}
      <OptionsBar
        ref={headerRef}
        className={`w-screen min-h-[40px] max-h-[10vh] shrink-0 overflow-hidden border-b ${
          darkMode ? "border-gray-700" : isFullscreen ? "border-[#e0dcd3]" : "border-[#d3d0cb]"
        } transition-colors duration-300`}
      >
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

      {/* LineStack: fills remaining space; clipped, no scrollbars */}
      <div className="flex-1 overflow-hidden">
        <WritingArea
          lines={lines}
          stackFontSize={stackFontSize}
          darkMode={darkMode}
          mode={mode as "write" | "nav"}
          offset={offset}
          isFullscreen={isFullscreen}
          linesContainerRef={linesContainerRef}
        />
      </div>

      {/* ACL: exactly one line high */}
      <ActiveInput className="shrink-0">
        <ActiveLine
          activeLine={activeLine}
          darkMode={darkMode}
          fontSize={fontSize}
          lineHeightPx={activeLineHeight}
          showCursor={showCursor}
          maxCharsPerLine={maxCharsPerLine}
          hiddenInputRef={hiddenInputRef}
          activeLineRef={activeLineRef}
          isAndroid={isAndroid}
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
