"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { useTypewriterStore } from "@/store/typewriter-store"
import WritingArea from "@/components/writing-area"
import ControlBar from "@/components/control-bar"
import OptionsBar from "@/components/options-bar"
import ActiveInput from "@/components/active-input"
import { ActiveLine } from "@/components/writing-area/ActiveLine"
import NavigationIndicator from "@/components/navigation-indicator"
import { useAndroidKeyboard } from "@/hooks/useAndroidKeyboard"
import { useResponsiveTypography } from "@/hooks/useResponsiveTypography"
import OfflineIndicator from "@/components/offline-indicator"
import SaveNotification from "@/components/save-notification"
import SettingsModal from "@/components/settings-modal"
import FlowSettingsModal from "@/components/flow-settings-modal"
import FlowModeOverlay from "@/components/flow-mode-overlay"

// Importiere die ApiKeyWarning-Komponente am Anfang der Datei
import ApiKeyWarning from "@/components/api-key-warning"
import { debounce } from "@/utils/debounce" // Korrekter Import

export default function TypewriterPage() {
  const {
    lines,
    activeLine,
    maxCharsPerLine,
    statistics,
    fontSize,
    stackFontSize,
    darkMode,
    updateLineBreakConfig,
    setFontSize,
    setStackFontSize,
    setFixedLineLength,
    paragraphRanges,
    inParagraph,
    mode,
    selectedLineIndex,
    offset,
    adjustOffset,
    navigateForward,
    navigateBackward,
    resetNavigation,
    flowMode,
    startFlowMode,
    stopFlowMode,
    updateFlowMode,
    saveSession,
    handleKeyPress,
    setContainerWidth,
    setMaxVisibleLines,
  } = useTypewriterStore()

  const viewportRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)
  const activeLineRef = useRef<HTMLDivElement>(null)
  const hiddenInputRef = useRef<HTMLTextAreaElement>(null)
  const linesContainerRef = useRef<HTMLDivElement>(null) // Ref für den Text-Container
  const pressedKeysRef = useRef<Set<string>>(new Set())

  // Ref zur Entdoppelung schneller gleicher Tastendrücke (z.B. Android IME)
  const lastKeyRef = useRef<{ key: string; time: number }>({ key: "", time: 0 })

  const [showCursor, setShowCursor] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isAndroid, setIsAndroid] = useState(false)
  const [orientation, setOrientation] = useState<"portrait" | "landscape">(
    typeof window !== "undefined" && window.innerWidth > window.innerHeight ? "landscape" : "portrait",
  )
  const [showSettings, setShowSettings] = useState(false)
  const [showFlowSettings, setShowFlowSettings] = useState(false)

  // Neue States für das Navigations-Overlay
  const [showNavigationHint, setShowNavigationHint] = useState(false)
  const navigationHintTimerRef = useRef<NodeJS.Timeout | null>(null)

  const { focusInputSafely } = useAndroidKeyboard({
    inputRef: hiddenInputRef,
  })

  const focusInput = useCallback(() => {
    focusInputSafely()
  }, [focusInputSafely])

  useResponsiveTypography({
    initialFontSize: fontSize,
    initialStackFontSize: stackFontSize,
    setFontSize: useTypewriterStore.getState().setFontSize,
    setStackFontSize: useTypewriterStore.getState().setStackFontSize,
  })

  const showTemporaryNavigationHint = useCallback(() => {
    if (navigationHintTimerRef.current) {
      clearTimeout(navigationHintTimerRef.current)
    }
    setShowNavigationHint(true)
    navigationHintTimerRef.current = setTimeout(() => {
      setShowNavigationHint(false)
    }, 1500)
  }, [])

  // Effekt für den blinkenden Cursor
  useEffect(() => {
    const interval = setInterval(() => {
      setShowCursor((prev) => !prev)
    }, 530)
    return () => clearInterval(interval)
  }, [])

  const openFlowSettings = useCallback(() => {
    setShowFlowSettings(true)
  }, [])

  const closeSettings = useCallback(() => {
    console.log("Einstellungen schließen (Hauptkomponente)")
    setShowSettings(false)
    // Verzögere den Fokus, um sicherzustellen, dass das Modal vollständig geschlossen ist
    setTimeout(() => {
      focusInput()
    }, 300)
  }, [focusInput])

  const closeFlowSettings = useCallback(() => {
    setShowFlowSettings(false)
    setTimeout(() => focusInput(), 300)
  }, [focusInput])

  // Modul 4: Rückkehr zur aktuellen Schreibposition bei Eingabe
  useEffect(() => {
    // Wenn wir in den Schreibmodus zurückkehren, fokussiere das Eingabefeld
    if (mode === "typing" && selectedLineIndex === null) {
      focusInput()
    }
  }, [mode, selectedLineIndex, focusInput])

  // Globale Tastatur-Listener
  useEffect(() => {
    const handleGlobalKeyDown = (event: KeyboardEvent) => {
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
      // Diese Bedingung blockiert jetzt NICHT mehr, wenn unser hidden-input den Fokus hat.
      if (target.closest('[role="dialog"], .settings-panel, input, textarea:not(#hidden-input)')) {
        return
      }

      const now = Date.now()
      if (
        event.key === lastKeyRef.current.key &&
        now - lastKeyRef.current.time < 50
      ) {
        return
      }
      lastKeyRef.current = { key: event.key, time: now }

      if (event.key.startsWith("Arrow")) {
        event.preventDefault()
        showTemporaryNavigationHint()
        if (event.key === "ArrowUp") adjustOffset(1)
        if (event.key === "ArrowDown") adjustOffset(-1)
        if (event.key === "ArrowLeft") navigateBackward(10)
        if (event.key === "ArrowRight") navigateForward(10)
        return
      }

      if (mode === "navigating") {
        if (event.key === "Escape" || event.key === "Enter") {
          event.preventDefault()
          resetNavigation()
          focusInput() // Fokus nach Beenden der Navigation wiederherstellen
          return
        }
      }

      if (event.key.length === 1 || event.key === "Backspace" || event.key === "Enter") {
        event.preventDefault()
        resetNavigation()
        handleKeyPress(event.key)
      }
    }

    const handleGlobalKeyUp = (event: KeyboardEvent) => {
      pressedKeysRef.current.delete(event.key)
    }

    document.addEventListener("keydown", handleGlobalKeyDown)
    document.addEventListener("keyup", handleGlobalKeyUp)
    return () => {
      document.removeEventListener("keydown", handleGlobalKeyDown)
      document.removeEventListener("keyup", handleGlobalKeyUp)
    }
  }, [
    mode,
    adjustOffset,
    navigateForward,
    navigateBackward,
    resetNavigation,
    handleKeyPress,
    showTemporaryNavigationHint,
    focusInput, // focusInput als Abhängigkeit hinzufügen
  ])

  const openSettings = useCallback(() => setShowSettings(true), [])

  // Effekt für Layout-Anpassungen
  useEffect(() => {
    const updateLayout = debounce(() => {
      // Korrektes Ref für die Breitenberechnung verwenden
      if (linesContainerRef.current) {
        setContainerWidth(linesContainerRef.current.clientWidth)
      }

      const viewportHeight = viewportRef.current?.clientHeight ?? window.innerHeight
      const inputHeight = activeLineRef.current?.offsetHeight ?? 0
      const optionsHeight = headerRef.current?.offsetHeight ?? 0

      let lineHeight = 0
      if (linesContainerRef.current) {
        const stackLine = (linesContainerRef.current.querySelector(
          ".line-stack div",
        ) as HTMLElement | null) ||
          (linesContainerRef.current.querySelector(
            ".line-stack",
          ) as HTMLElement | null)
        if (stackLine) {
          lineHeight = parseFloat(getComputedStyle(stackLine).lineHeight)
        }
      }
      if (lineHeight) {
        const maxLines = Math.floor(
          (viewportHeight - inputHeight - optionsHeight) / lineHeight,
        )
        setMaxVisibleLines(maxLines)
      }

      if (typeof window !== "undefined") {
        setOrientation(window.innerWidth > window.innerHeight ? "landscape" : "portrait")
      }
    }, 150)

    const isAndroidDevice = /Android/.test(navigator.userAgent)
    setIsAndroid(isAndroidDevice)
    if (isAndroidDevice) document.body.classList.add("android-typewriter")

    window.addEventListener("resize", updateLayout)
    updateLayout()

    return () => window.removeEventListener("resize", updateLayout)
  }, [setContainerWidth])

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      viewportRef.current?.requestFullscreen().catch((err) => console.error("Fullscreen error:", err))
    } else {
      document.exitFullscreen().catch((err) => console.error("Exit fullscreen error:", err))
    }
  }, [])

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener("fullscreenchange", handleFullscreenChange)
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange)
  }, [])

  return (
    <div
      ref={viewportRef}
      className={`h-screen flex flex-col ${
        darkMode ? "dark bg-[#121212] text-[#E0E0E0]" : "bg-[#f3efe9] text-gray-900"
      }`}
      tabIndex={-1}
      onClick={focusInput}
    >
      <ApiKeyWarning />

      <OptionsBar
        ref={headerRef}
        className={`w-screen min-h-[40px] max-h-[10vh] shrink-0 border-b ${
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

      <div className="flex-1 overflow-hidden">
        <WritingArea
          lines={lines}
          activeLine={activeLine}
          stackFontSize={stackFontSize}
          darkMode={darkMode}
          mode={mode}
          offset={offset}
          isFullscreen={isFullscreen}
          linesContainerRef={linesContainerRef}
        />
      </div>

      <ActiveInput className="shrink-0 sticky bottom-0">
      <ActiveLine
          activeLine={activeLine}
          darkMode={darkMode}
          fontSize={fontSize}
          showCursor={showCursor}
          maxCharsPerLine={maxCharsPerLine}
          hiddenInputRef={hiddenInputRef}
          activeLineRef={activeLineRef}
          isAndroid={isAndroid}
          isFullscreen={isFullscreen}
        />
      </ActiveInput>

      <NavigationIndicator darkMode={darkMode} />
      <SaveNotification />

      <FlowModeOverlay />

      {/* Offline-Indikator */}
      <OfflineIndicator darkMode={darkMode} />
      {mode === "navigating" && showNavigationHint && (
        <div
          className={`fixed bottom-4 left-1/2 transform -translate-x-1/2 py-1 px-2 rounded-full z-50 ${
            darkMode ? "bg-gray-800 text-gray-200" : "bg-white text-gray-800"
          } shadow-lg flex items-center gap-1 text-xs opacity-80`}
          role="status"
          aria-live="polite"
        >
          <span className="font-medium">ESC/Enter zum Beenden</span>
        </div>
      )}
      <SettingsModal isOpen={showSettings} onClose={closeSettings} darkMode={darkMode} />
      <FlowSettingsModal isOpen={showFlowSettings} onClose={closeFlowSettings} darkMode={darkMode} />
    </div>
  )
}
