"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { useTypewriterStore } from "@/store/typewriter-store"
import WritingArea from "@/components/writing-area"
import ControlBar from "@/components/control-bar"
import { calculateOptimalLineLength } from "@/utils/line-break-utils"
import DebugInfo from "@/components/debug-info"
import { debounce } from "@/utils/debounce"
import NavigationIndicator from "@/components/navigation-indicator"
import { useKeyboardNavigation } from "@/hooks/use-keyboard-navigation"
import { useAndroidKeyboard } from "@/hooks/useAndroidKeyboard"
import { useResponsiveTypography } from "@/hooks/useResponsiveTypography"
import OfflineIndicator from "@/components/offline-indicator"
import SaveNotification from "@/components/save-notification"
import SettingsModal from "@/components/settings-modal"

// Importiere die ApiKeyWarning-Komponente am Anfang der Datei
import ApiKeyWarning from "@/components/api-key-warning"

// Füge die Sound-Effekte zur Hauptkomponente hinzu
export default function TypewriterPage() {
  // Get state from store
  const {
    lines,
    activeLine,
    setActiveLine,
    addLineToStack,
    maxCharsPerLine,
    resetSession,
    statistics,
    lineBreakConfig,
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
    navigateUp,
    navigateDown,
    navigateForward,
    navigateBackward,
    resetNavigation,
  } = useTypewriterStore()

  // DOM references
  const containerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const hiddenInputRef = useRef<HTMLTextAreaElement>(null)
  const linesContainerRef = useRef<HTMLDivElement>(null)

  // Local state
  const [showCursor, setShowCursor] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isAndroid, setIsAndroid] = useState(false)
  const [isSmallScreen, setIsSmallScreen] = useState(false)
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false)
  const [orientation, setOrientation] = useState<"portrait" | "landscape">(
    typeof window !== "undefined" && window.innerWidth > window.innerHeight ? "landscape" : "portrait",
  )
  const [scrollPosition, setScrollPosition] = useState(0)
  const [showSettings, setShowSettings] = useState(false)

  // Neue States für das Navigations-Overlay
  const [showNavigationHint, setShowNavigationHint] = useState(false)
  const navigationHintTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Neue Android-optimierte Hooks verwenden
  const {
    isKeyboardVisible: isKeyboardVisibleAndroid,
    keyboardHeight,
    focusInputSafely,
  } = useAndroidKeyboard({
    inputRef: hiddenInputRef,
  })

  // Responsives Typography-Scaling
  const { deviceCategory } = useResponsiveTypography({
    initialFontSize: fontSize,
    initialStackFontSize: stackFontSize,
    setFontSize,
    setStackFontSize,
  })

  // Aktiviere automatischen Zeilenumbruch beim ersten Laden
  useEffect(() => {
    // Nur beim ersten Laden ausführen
    if (!lineBreakConfig.autoMaxChars) {
      updateLineBreakConfig({ autoMaxChars: true })
    }
  }, [lineBreakConfig.autoMaxChars, updateLineBreakConfig])

  // Energieoptimierter Cursor mit Inaktivitäts-Pausierung
  useEffect(() => {
    let animationId: number
    let lastActivity = Date.now()
    let isActive = true

    const blinkCursor = () => {
      const now = Date.now()
      // Pausiere Cursor nach 30 Sekunden Inaktivität
      if (now - lastActivity > 30000) {
        setShowCursor(true) // Cursor dauerhaft sichtbar bei Inaktivität
        return
      }

      setShowCursor((prev) => !prev)
      // Verwende setTimeout statt setInterval für bessere Kontrolle
      setTimeout(() => {
        animationId = requestAnimationFrame(blinkCursor)
      }, 530)
    }

    const resetActivity = () => {
      lastActivity = Date.now()
      if (!isActive) {
        isActive = true
        blinkCursor()
      }
    }

    // Aktivitäts-Listener (passiv für bessere Performance)
    document.addEventListener("keydown", resetActivity, { passive: true })
    document.addEventListener("touchstart", resetActivity, { passive: true })
    document.addEventListener("click", resetActivity, { passive: true })

    blinkCursor()

    return () => {
      if (animationId) cancelAnimationFrame(animationId)
      document.removeEventListener("keydown", resetActivity)
      document.removeEventListener("touchstart", resetActivity)
      document.removeEventListener("click", resetActivity)
    }
  }, [])

  // Verwende den Hook
  const { focusInput } = useKeyboardNavigation({
    hiddenInputRef,
    isAndroid,
  })

  // Funktion zum temporären Einblenden des Navigations-Overlays
  const showTemporaryNavigationHint = useCallback(() => {
    // Bestehenden Timer löschen, falls vorhanden
    if (navigationHintTimerRef.current) {
      clearTimeout(navigationHintTimerRef.current)
    }

    // Overlay anzeigen
    setShowNavigationHint(true)

    // Timer setzen, um das Overlay nach 1,5 Sekunden auszublenden
    navigationHintTimerRef.current = setTimeout(() => {
      setShowNavigationHint(false)
      navigationHintTimerRef.current = null
    }, 1500)
  }, [])

  // Öffne und schließe Einstellungen
  const openSettings = useCallback(() => {
    console.log("Einstellungen öffnen (Hauptkomponente)")
    setShowSettings(true)
  }, [])

  const closeSettings = useCallback(() => {
    console.log("Einstellungen schließen (Hauptkomponente)")
    setShowSettings(false)
    // Verzögere den Fokus, um sicherzustellen, dass das Modal vollständig geschlossen ist
    setTimeout(() => {
      focusInput()
    }, 300)
  }, [focusInput])

  // Modul 4: Rückkehr zur aktuellen Schreibposition bei Eingabe
  useEffect(() => {
    // Wenn wir in den Schreibmodus zurückkehren, fokussiere das Eingabefeld
    if (mode === "typing" && selectedLineIndex === null) {
      focusInput()
    }
  }, [mode, selectedLineIndex, focusInput])

  // Modul 2: Pfeiltasten-Navigation durch frühere Zeilen
  // Füge globalen Event-Listener für Tastaturereignisse hinzu
  useEffect(() => {
    // Füge den Event-Listener hinzu
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement
      const isInputField = target.tagName === "INPUT" || target.tagName === "TEXTAREA"

      // Nur preventDefault wenn wirklich nötig
      if (!isInputField) {
        if (event.key === "ArrowUp") {
          event.preventDefault()
          navigateUp()
          showTemporaryNavigationHint()
        } else if (event.key === "ArrowDown") {
          event.preventDefault()
          navigateDown()
          showTemporaryNavigationHint()
        } else if (event.key === "ArrowLeft") {
          event.preventDefault()
          navigateBackward(10)
          showTemporaryNavigationHint()
        } else if (event.key === "ArrowRight") {
          event.preventDefault()
          navigateForward(10)
          showTemporaryNavigationHint()
        } else if (event.key === "Escape" && mode === "navigating") {
          event.preventDefault()
          resetNavigation()
          focusInput()
        } else if (event.key === "Enter" && mode === "navigating") {
          event.preventDefault()
          resetNavigation()
          focusInput()
        }
      }
    }

    // Verwende passive: false nur wo nötig
    document.addEventListener("keydown", handleKeyDown, { passive: false })

    // Entferne den Event-Listener beim Aufräumen
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [
    navigateUp,
    navigateDown,
    navigateForward,
    navigateBackward,
    resetNavigation,
    focusInput,
    mode,
    showTemporaryNavigationHint,
  ])

  // Füge einen verbesserten Scroll-Handler hinzu, um sicherzustellen, dass die letzte Zeile immer sichtbar ist
  // Füge diesen Code nach dem useEffect für die Tastaturnavigation ein (ca. Zeile 200-230)

  // Verbesserte Scroll-Logik für alle Geräte
  useEffect(() => {
    // Nur im Typing-Modus
    if (mode !== "typing") return

    // Funktion zum Scrollen zum Ende des Containers
    const scrollToBottom = () => {
      if (linesContainerRef.current) {
        // Finde das letzte Element im Container
        const elements = linesContainerRef.current.querySelectorAll("[data-line-index]")
        const lastElement = elements[elements.length - 1]

        // Wenn ein Element gefunden wurde, scrolle zu ihm
        if (lastElement) {
          lastElement.scrollIntoView({ behavior: "auto", block: "end" })
        } else {
          // Fallback: Scrolle zum Ende des Containers
          linesContainerRef.current.scrollTop = linesContainerRef.current.scrollHeight
        }
      }
    }

    // Scroll sofort und nach einer kurzen Verzögerung (für Rendering-Probleme)
    scrollToBottom()
    const timeoutId = setTimeout(scrollToBottom, 50)

    // Nochmals nach einer längeren Verzögerung (für langsame Geräte)
    const longTimeoutId = setTimeout(scrollToBottom, 300)

    return () => {
      clearTimeout(timeoutId)
      clearTimeout(longTimeoutId)
    }
  }, [lines.length, mode])

  useEffect(() => {
    // Verwende die optimierte Fokus-Funktion für Android
    if (isAndroid) {
      focusInputSafely()
    } else {
      // Bestehende Fokus-Logik für andere Geräte beibehalten
      focusInput()
    }

    // Focus on clicks - verbessert für Android
    const handleClick = (e: MouseEvent) => {
      // Prüfe, ob das geklickte Element kein Button oder Input ist
      const target = e.target as HTMLElement
      if (
        target.tagName !== "BUTTON" &&
        target.tagName !== "INPUT" &&
        target.tagName !== "TEXTAREA" &&
        !target.closest("button") &&
        !target.closest("input") &&
        !target.closest("textarea") &&
        !target.closest('[role="dialog"]') &&
        !target.closest(".settings-panel") // Ignoriere Klicks auf das Einstellungspanel
      ) {
        if (isAndroid) {
          focusInputSafely()
        } else {
          focusInput()
        }
      }
    }
    document.addEventListener("click", handleClick)

    // Focus on fullscreen changes
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
      // Verzögere den Fokus, um Probleme mit der Vollbildänderung zu vermeiden
      setTimeout(() => {
        if (isAndroid) {
          focusInputSafely()
        } else {
          focusInput()
        }
      }, 300)
    }
    document.addEventListener("fullscreenchange", handleFullscreenChange)

    return () => {
      document.removeEventListener("click", handleClick)
      document.removeEventListener("fullscreenchange", handleFullscreenChange)
    }
  }, [focusInput, focusInputSafely, isAndroid])

  // Verbesserte Orientierungserkennung für Android
  const handleOrientationChange = useCallback(() => {
    if (typeof window === "undefined") return

    const newOrientation = window.innerWidth > window.innerHeight ? "landscape" : "portrait"
    setOrientation(newOrientation)
    setIsSmallScreen(window.innerWidth < 768)

    // Erzwinge eine Neuberechnung der Zeilenlänge
    if (lineBreakConfig.autoMaxChars && contentRef.current) {
      // Verzögere die Berechnung, um sicherzustellen, dass die Größenänderung abgeschlossen ist
      setTimeout(() => {
        const containerWidth = contentRef.current?.clientWidth || 800
        const optimalLineLength = calculateOptimalLineLength(containerWidth, fontSize)
        updateLineBreakConfig({ maxCharsPerLine: optimalLineLength })
      }, 300)
    }
  }, [fontSize, lineBreakConfig.autoMaxChars, updateLineBreakConfig])

  useEffect(() => {
    if (typeof navigator === "undefined") return
    const isAndroidDevice = /Android/.test(navigator.userAgent)
    setIsAndroid(isAndroidDevice)
    setIsSmallScreen(window.innerWidth < 768 || isAndroidDevice)

    // Auf Android: Verhindere Zoom durch Doppeltippen
    if (isAndroidDevice) {
      const meta = document.querySelector('meta[name="viewport"]')
      if (meta) {
        meta.setAttribute("content", "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no")
      }

      // Setze Android-spezifische Klassen
      document.body.classList.add("android-typewriter")
      document.body.dataset.deviceCategory = deviceCategory
    }

    if (typeof window === "undefined") return

    window.addEventListener("resize", handleOrientationChange)

    // Spezifischer Event-Listener für Android-Orientierungsänderungen
    if (isAndroid) {
      window.addEventListener("orientationchange", () => {
        // Verzögere die Verarbeitung, um sicherzustellen, dass die Orientierungsänderung abgeschlossen ist
        setTimeout(handleOrientationChange, 300)
      })
    }

    // Initiale Berechnung
    handleOrientationChange()

    return () => {
      window.removeEventListener("resize", handleOrientationChange)
      if (isAndroid) {
        window.removeEventListener("orientationchange", handleOrientationChange)
      }
    }
  }, [handleOrientationChange, isAndroid, deviceCategory])

  // Modul 5: Zeilenumbruchlogik wird bei Layoutveränderung automatisch neu berechnet
  useEffect(() => {
    if (!lineBreakConfig.autoMaxChars || !contentRef.current) return

    const updateMaxChars = debounce(
      () => {
        if (!contentRef.current) return

        const containerWidth = contentRef.current.clientWidth || 800
        const optimalLineLength = calculateOptimalLineLength(containerWidth, fontSize)
        const currentLength = lineBreakConfig.maxCharsPerLine
        const difference = Math.abs(optimalLineLength - currentLength)
        const percentChange = difference / currentLength

        // Erhöhe Schwellenwert für mobile Geräte
        const threshold = isAndroid ? 0.1 : 0.05
        if (percentChange > threshold) {
          updateLineBreakConfig({ maxCharsPerLine: optimalLineLength })
        }
      },
      // Deutlich längere Verzögerung für Energieeffizienz
      isAndroid ? 2000 : 1000,
    )

    // Initial calculation - sofort ausführen für schnellere initiale Anpassung
    updateMaxChars()

    // Recalculate on resize
    let resizeObserver: ResizeObserver | null = null

    try {
      resizeObserver = new ResizeObserver(() => {
        updateMaxChars()
      })

      resizeObserver.observe(contentRef.current)
    } catch (error) {
      console.error("ResizeObserver error:", error)

      // Fallback für Geräte ohne ResizeObserver
      const handleResize = () => {
        updateMaxChars()
      }
      window.addEventListener("resize", handleResize)

      return () => {
        window.removeEventListener("resize", handleResize)
      }
    }

    return () => {
      if (resizeObserver) {
        try {
          if (contentRef.current) {
            resizeObserver.unobserve(contentRef.current)
          }
          resizeObserver.disconnect()
        } catch (error) {
          console.error("Error cleaning up ResizeObserver:", error)
        }
      }
    }
  }, [lineBreakConfig.autoMaxChars, fontSize, isAndroid, lineBreakConfig.maxCharsPerLine, updateLineBreakConfig])

  /**
   * Toggle between fullscreen and normal mode with verbesserter Android-Unterstützung
   */
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement && containerRef.current) {
      containerRef.current.requestFullscreen().catch((err) => {
        console.error("Fullscreen error:", err)

        // Fallback für Android-Geräte ohne Fullscreen-API
        if (isAndroid) {
          const elem = containerRef.current
          if (elem) {
            elem.style.position = "fixed"
            elem.style.top = "0"
            elem.style.left = "0"
            elem.style.width = "100%"
            elem.style.height = "100%"
            elem.style.zIndex = "9999"
            setIsFullscreen(true)
          }
        }
      })
    } else if (document.fullscreenElement) {
      document.exitFullscreen().catch((err) => {
        console.error("Exit fullscreen error:", err)

        // Fallback für Android-Geräte ohne Fullscreen-API
        if (isAndroid && containerRef.current) {
          const elem = containerRef.current
          elem.style.position = ""
          elem.style.top = ""
          elem.style.left = ""
          elem.style.width = ""
          elem.style.height = ""
          elem.style.zIndex = ""
          setIsFullscreen(false)
        }
      })
    }
  }, [isAndroid])

  // Überprüfen, ob es sich um ein Android-Gerät handelt
  useEffect(() => {
    if (typeof navigator === "undefined") return
    const isAndroidDevice = /Android/.test(navigator.userAgent)
    setIsAndroid(isAndroidDevice)

    // Auf Android: Verhindere Zoom durch Doppeltippen
    if (isAndroidDevice) {
      const meta = document.querySelector('meta[name="viewport"]')
      if (meta) {
        meta.setAttribute("content", "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no")
      }
    }
  }, [])

  // Füge die Komponente am Anfang des return-Statements ein, direkt nach dem öffnenden div-Tag
  return (
    <div
      ref={containerRef}
      className={`min-h-screen flex flex-col typewriter-container ${
        darkMode
          ? "dark bg-[#121212] text-[#E0E0E0]"
          : (isFullscreen ? "bg-[#f8f5f0]" : "bg-[#f3efe9]") + " text-gray-900"
      } transition-colors duration-300 ${isAndroid ? "android-typewriter" : ""} ${isFullscreen && isAndroid ? "fullscreen" : ""} ${orientation}`}
      data-mode={mode}
      data-device-category={deviceCategory}
      data-fullscreen={isFullscreen ? "true" : "false"}
      style={{
        overflow: "hidden",
        // Anpassung an Tastaturhöhe für Android
        ...(isAndroid && isKeyboardVisibleAndroid ? { paddingBottom: `${keyboardHeight}px` } : {}),
      }}
    >
      {/* API-Schlüssel-Warnung */}
      <ApiKeyWarning />

      {/* Rest des Codes bleibt unverändert */}
      {/* Header nur anzeigen, wenn nicht im Vollbildmodus auf kleinen Bildschirmen */}
      {!(isFullscreen && isSmallScreen) && (
        <header
          className={`border-b ${
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
          />
        </header>
      )}

      {/* Im Vollbildmodus auf kleinen Bildschirmen: ControlBar in der rechten oberen Ecke */}
      {isFullscreen && isSmallScreen && (
        <ControlBar
          wordCount={statistics.wordCount}
          pageCount={statistics.pageCount}
          toggleFullscreen={toggleFullscreen}
          hiddenInputRef={hiddenInputRef}
          isFullscreen={isFullscreen}
          openSettings={openSettings}
        />
      )}

      <main className={`flex-1 flex flex-col p-4 md:p-6 lg:p-8 ${darkMode ? "bg-gray-900" : ""} overflow-hidden`}>
        <section
          ref={contentRef}
          className={`flex-1 flex flex-col ${
            darkMode ? "bg-gray-800 shadow-xl" : (isFullscreen ? "bg-white" : "bg-[#fcfcfa]") + " shadow-md"
          } rounded-lg overflow-hidden transition-colors duration-300 relative`}
        >
          <WritingArea
            lines={lines}
            activeLine={activeLine}
            setActiveLine={setActiveLine}
            addLineToStack={addLineToStack}
            maxCharsPerLine={maxCharsPerLine}
            fontSize={fontSize}
            stackFontSize={stackFontSize}
            hiddenInputRef={hiddenInputRef}
            showCursor={showCursor}
            lineBreakConfig={lineBreakConfig}
            darkMode={darkMode}
            paragraphRanges={paragraphRanges}
            mode={mode}
            selectedLineIndex={selectedLineIndex}
            isFullscreen={isFullscreen}
            linesContainerRef={linesContainerRef}
          />
        </section>
      </main>

      {/* Footer nur anzeigen, wenn nicht im Vollbildmodus auf kleinen Bildschirmen */}
      {!(isFullscreen && isSmallScreen) && (
        <footer
          className={`p-3 border-t ${
            darkMode ? "border-gray-700 text-gray-400 bg-gray-900" : "border-[#d3d0cb] text-gray-600"
          } text-center text-sm font-serif`}
        >
          Typewriter — Konzentriere dich auf dein Schreiben
        </footer>
      )}

      {process.env.NODE_ENV === "development" && (
        <DebugInfo
          containerWidth={contentRef.current?.clientWidth || 0}
          fontSize={fontSize}
          darkMode={darkMode}
          mode={mode}
          selectedLineIndex={selectedLineIndex}
          scrollPosition={scrollPosition}
        />
      )}
      <NavigationIndicator darkMode={darkMode} />

      {/* Speicher-Benachrichtigung */}
      <SaveNotification />

      {/* Offline-Indikator */}
      <OfflineIndicator darkMode={darkMode} />

      {/* Modus-Indikator für Navigation Mode - kleiner und nur temporär */}
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

      {/* Einstellungen Modal - Separate Komponente */}
      <SettingsModal isOpen={showSettings} onClose={closeSettings} darkMode={darkMode} />

      {/* Offline-Indikator hinzufügen */}
      <OfflineIndicator darkMode={darkMode} />
    </div>
  )
}
