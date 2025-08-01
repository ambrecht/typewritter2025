"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { useTypewriterStore } from "@/store/typewriter-store"
import WritingArea from "@/components/writing-area"
import ControlBar from "@/components/control-bar"
import NavigationIndicator from "@/components/navigation-indicator"
import { useAndroidKeyboard } from "@/hooks/useAndroidKeyboard"
import { useResponsiveTypography } from "@/hooks/useResponsiveTypography"
import OfflineIndicator from "@/components/offline-indicator"
import SaveNotification from "@/components/save-notification"
import SettingsModal from "@/components/settings-modal"
import ApiKeyWarning from "@/components/api-key-warning"
import { debounce } from "@/utils/debounce" // Korrekter Import

export default function TypewriterPage() {
  const {
    lines,
    activeLine,
    addLineToStack,
    maxCharsPerLine,
    statistics,
    lineBreakConfig,
    fontSize,
    stackFontSize,
    darkMode,
    setContainerWidth,
    mode,
    selectedLineIndex,
    navigateUp,
    navigateDown,
    navigateForward,
    navigateBackward,
    resetNavigation,
    handleKeyPress,
  } = useTypewriterStore()

  const containerRef = useRef<HTMLDivElement>(null)
  const hiddenInputRef = useRef<HTMLTextAreaElement>(null)
  const linesContainerRef = useRef<HTMLDivElement>(null) // Ref für den Text-Container

  const [showCursor, setShowCursor] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isAndroid, setIsAndroid] = useState(false)
  const [isSmallScreen, setIsSmallScreen] = useState(false)
  const [orientation, setOrientation] = useState<"portrait" | "landscape">(
    typeof window !== "undefined" && window.innerWidth > window.innerHeight ? "landscape" : "portrait",
  )
  const [showSettings, setShowSettings] = useState(false)
  const [showNavigationHint, setShowNavigationHint] = useState(false)
  const navigationHintTimerRef = useRef<NodeJS.Timeout | null>(null)

  const { focusInputSafely } = useAndroidKeyboard({
    inputRef: hiddenInputRef,
  })

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

  const focusInput = useCallback(() => {
    if (isAndroid) {
      focusInputSafely()
    } else {
      // Stelle sicher, dass der Fokus gesetzt wird, auch wenn das Fenster nicht aktiv war
      setTimeout(() => hiddenInputRef.current?.focus(), 0)
    }
  }, [isAndroid, focusInputSafely])

  // Globale Tastatur-Listener
  /**
   * Registriert einen globalen Keydown‑Listener für die Textverarbeitung.
   *
   * Der Listener wird nur einmal angehängt und nutzt die aktuelle
   * Zustandsschnittstelle von `useTypewriterStore` bei jedem Event.
   * Wiederholte Tastenanschläge oder laufende Kompositionsereignisse
   * werden ignoriert, um Mehrfacheingaben zu vermeiden.
   */
  useEffect(() => {
    const handleGlobalKeyDown = (event: KeyboardEvent) => {
      // Wiederholte bzw. IME‑Kompositions‑Ereignisse ignorieren
      // see https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/repeat
      // – bei langer Berührung oder virtueller Tastatur werden mehrere
      // keydown‑Events erzeugt. Das Filtern verhindert doppelte Zeichen.
      if (event.repeat || (event as any).isComposing) {
        return
      }

      const target = event.target as HTMLElement
      if (target.closest('[role="dialog"], .settings-panel, input, textarea:not(#hidden-input)')) {
        return
      }

      // Aktuelle Werte aus dem Zustand abrufen, um Stale‑Closures zu vermeiden
      const {
        mode: currentMode,
        navigateUp: currentNavigateUp,
        navigateDown: currentNavigateDown,
        navigateForward: currentNavigateForward,
        navigateBackward: currentNavigateBackward,
        resetNavigation: currentResetNavigation,
        handleKeyPress: currentHandleKeyPress,
      } = useTypewriterStore.getState()

      if (event.key.startsWith("Arrow")) {
        event.preventDefault()
        showTemporaryNavigationHint()
        if (event.key === "ArrowUp") currentNavigateUp()
        if (event.key === "ArrowDown") currentNavigateDown()
        if (event.key === "ArrowLeft") currentNavigateBackward(10)
        if (event.key === "ArrowRight") currentNavigateForward(10)
        return
      }

      if (currentMode === "navigating") {
        if (event.key === "Escape" || event.key === "Enter") {
          event.preventDefault()
          currentResetNavigation()
          focusInput() // Fokus nach Beenden der Navigation wiederherstellen
        }
        return
      }

      if (event.key.length === 1 || event.key === "Backspace" || event.key === "Enter") {
        event.preventDefault()
        currentHandleKeyPress(event.key)
      }
    }

    document.addEventListener("keydown", handleGlobalKeyDown)
    return () => {
      document.removeEventListener("keydown", handleGlobalKeyDown)
    }
  }, [])

  const openSettings = useCallback(() => setShowSettings(true), [])
  const closeSettings = useCallback(() => {
    setShowSettings(false)
    focusInput()
  }, [focusInput])

  // Effekt für Layout-Anpassungen
  useEffect(() => {
    const updateLayout = debounce(() => {
      // Korrektes Ref für die Breitenberechnung verwenden
      if (linesContainerRef.current) {
        setContainerWidth(linesContainerRef.current.clientWidth)
      }
      if (typeof window !== "undefined") {
        setOrientation(window.innerWidth > window.innerHeight ? "landscape" : "portrait")
        setIsSmallScreen(window.innerWidth < 768)
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
      containerRef.current?.requestFullscreen().catch((err) => console.error("Fullscreen error:", err))
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
      ref={containerRef}
      className={`min-h-screen flex flex-col typewriter-container font-sans outline-none ${
        darkMode ? "dark bg-[#121212] text-[#E0E0E0]" : "bg-[#f3efe9] text-gray-900"
      }`}
      tabIndex={-1}
      onClick={focusInput} // Dieser Handler ist entscheidend für die Fokus-Wiederherstellung
    >
      <ApiKeyWarning />
      <header
        className={`border-b ${
          darkMode ? "border-gray-700" : "border-[#d3d0cb]"
        } transition-colors duration-300 flex-shrink-0`}
      >
        <ControlBar
          wordCount={statistics.wordCount}
          pageCount={statistics.pageCount}
          toggleFullscreen={toggleFullscreen}
          hiddenInputRef={hiddenInputRef}
          isFullscreen={isFullscreen}
          openSettings={openSettings}
        />
      </header>

      <main className="flex-1 flex flex-col p-4 md:p-6 lg:p-8 overflow-hidden">
        <section
          className={`flex-1 flex flex-col ${
            darkMode ? "bg-gray-800 shadow-xl" : "bg-[#fcfcfa] shadow-md"
          } rounded-lg overflow-hidden transition-colors duration-300 relative`}
        >
          <WritingArea
            lines={lines}
            activeLine={activeLine}
            maxCharsPerLine={maxCharsPerLine}
            fontSize={fontSize}
            stackFontSize={stackFontSize}
            hiddenInputRef={hiddenInputRef}
            showCursor={showCursor}
            lineBreakConfig={lineBreakConfig}
            darkMode={darkMode}
            mode={mode}
            selectedLineIndex={selectedLineIndex}
            isFullscreen={isFullscreen}
            linesContainerRef={linesContainerRef}
          />
        </section>
      </main>

      <NavigationIndicator darkMode={darkMode} />
      <SaveNotification />
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
    </div>
  )
}
