"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { useTypewriterStore } from "@/store/typewriter-store"
import WritingArea from "@/components/writing-area"
import ControlBar from "@/components/control-bar"
import NavigationIndicator from "@/components/navigation-indicator"
import { useKeyboardNavigation } from "@/hooks/use-keyboard-navigation"
import { useAndroidKeyboard } from "@/hooks/useAndroidKeyboard"
import { useResponsiveTypography } from "@/hooks/useResponsiveTypography"
import OfflineIndicator from "@/components/offline-indicator"
import SaveNotification from "@/components/save-notification"
import SettingsModal from "@/components/settings-modal"
import ApiKeyWarning from "@/components/api-key-warning"
import debounce from "lodash.debounce" // Import debounce from lodash

export default function TypewriterPage() {
  const {
    lines,
    activeLine,
    setActiveLine,
    addLineToStack,
    maxCharsPerLine,
    statistics,
    lineBreakConfig,
    fontSize,
    stackFontSize,
    darkMode,
    updateLineBreakConfig,
    setFontSize,
    setStackFontSize,
    setContainerWidth,
    mode,
    selectedLineIndex,
    navigateUp,
    navigateDown,
    navigateForward,
    navigateBackward,
    resetNavigation,
  } = useTypewriterStore()

  const containerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const hiddenInputRef = useRef<HTMLTextAreaElement>(null)
  const linesContainerRef = useRef<HTMLDivElement>(null)

  const [showCursor, setShowCursor] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isAndroid, setIsAndroid] = useState(false)
  const [isSmallScreen, setIsSmallScreen] = useState(false)
  const [orientation, setOrientation] = useState<"portrait" | "landscape">(
    typeof window !== "undefined" && window.innerWidth > window.innerHeight ? "landscape" : "portrait",
  )
  const [scrollPosition, setScrollPosition] = useState(0)
  const [showSettings, setShowSettings] = useState(false)
  const [showNavigationHint, setShowNavigationHint] = useState(false)
  const navigationHintTimerRef = useRef<NodeJS.Timeout | null>(null)

  const {
    isKeyboardVisible: isKeyboardVisibleAndroid,
    keyboardHeight,
    focusInputSafely,
  } = useAndroidKeyboard({
    inputRef: hiddenInputRef,
  })

  const { deviceCategory } = useResponsiveTypography({
    initialFontSize: fontSize,
    initialStackFontSize: stackFontSize,
    setFontSize,
    setStackFontSize,
  })

  useEffect(() => {
    let animationId: number
    let lastActivity = Date.now()
    let isActive = true

    const blinkCursor = () => {
      const now = Date.now()
      if (now - lastActivity > 30000) {
        setShowCursor(true)
        return
      }
      setShowCursor((prev) => !prev)
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

  const { focusInput } = useKeyboardNavigation({
    hiddenInputRef,
    isAndroid,
  })

  const showTemporaryNavigationHint = useCallback(() => {
    if (navigationHintTimerRef.current) {
      clearTimeout(navigationHintTimerRef.current)
    }
    setShowNavigationHint(true)
    navigationHintTimerRef.current = setTimeout(() => {
      setShowNavigationHint(false)
      navigationHintTimerRef.current = null
    }, 1500)
  }, [])

  const openSettings = useCallback(() => {
    setShowSettings(true)
  }, [])

  const closeSettings = useCallback(() => {
    setShowSettings(false)
    setTimeout(() => {
      focusInput()
    }, 300)
  }, [focusInput])

  useEffect(() => {
    if (mode === "typing" && selectedLineIndex === null) {
      focusInput()
    }
  }, [mode, selectedLineIndex, focusInput])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement
      const isInputField = target.tagName === "INPUT" || target.tagName === "TEXTAREA"

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
    document.addEventListener("keydown", handleKeyDown, { passive: false })
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

  useEffect(() => {
    if (mode !== "typing") return
    const scrollToBottom = () => {
      if (linesContainerRef.current) {
        const elements = linesContainerRef.current.querySelectorAll("[data-line-index]")
        const lastElement = elements[elements.length - 1]
        if (lastElement) {
          lastElement.scrollIntoView({ behavior: "auto", block: "end" })
        } else {
          linesContainerRef.current.scrollTop = linesContainerRef.current.scrollHeight
        }
      }
    }
    scrollToBottom()
    const timeoutId = setTimeout(scrollToBottom, 50)
    const longTimeoutId = setTimeout(scrollToBottom, 300)
    return () => {
      clearTimeout(timeoutId)
      clearTimeout(longTimeoutId)
    }
  }, [lines.length, mode])

  useEffect(() => {
    if (isAndroid) {
      focusInputSafely()
    } else {
      focusInput()
    }
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (
        target.tagName !== "BUTTON" &&
        target.tagName !== "INPUT" &&
        target.tagName !== "TEXTAREA" &&
        !target.closest("button") &&
        !target.closest("input") &&
        !target.closest("textarea") &&
        !target.closest('[role="dialog"]') &&
        !target.closest(".settings-panel")
      ) {
        if (isAndroid) {
          focusInputSafely()
        } else {
          focusInput()
        }
      }
    }
    document.addEventListener("click", handleClick)
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
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

  // Effect for handling resize and orientation changes
  useEffect(() => {
    const updateLayout = debounce(() => {
      if (contentRef.current) {
        const newWidth = contentRef.current.clientWidth
        setContainerWidth(newWidth)
      }
      if (typeof window !== "undefined") {
        const newOrientation = window.innerWidth > window.innerHeight ? "landscape" : "portrait"
        setOrientation(newOrientation)
        setIsSmallScreen(window.innerWidth < 768)
      }
    }, 100)

    const isAndroidDevice = /Android/.test(navigator.userAgent)
    setIsAndroid(isAndroidDevice)
    if (isAndroidDevice) {
      document.body.classList.add("android-typewriter")
      document.body.dataset.deviceCategory = deviceCategory
    }

    window.addEventListener("resize", updateLayout)
    if (isAndroid) {
      window.addEventListener("orientationchange", updateLayout)
    }

    updateLayout() // Initial call

    return () => {
      window.removeEventListener("resize", updateLayout)
      if (isAndroid) {
        window.removeEventListener("orientationchange", updateLayout)
      }
    }
  }, [setContainerWidth, isAndroid, deviceCategory])

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement && containerRef.current) {
      containerRef.current.requestFullscreen().catch((err) => {
        console.error("Fullscreen error:", err)
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

  useEffect(() => {
    const isAndroidDevice = /Android/.test(navigator.userAgent)
    setIsAndroid(isAndroidDevice)
    if (isAndroidDevice) {
      const meta = document.querySelector('meta[name="viewport"]')
      if (meta) {
        meta.setAttribute("content", "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no")
      }
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className={`min-h-screen flex flex-col typewriter-container font-sans ${
        darkMode
          ? "dark bg-[#121212] text-[#E0E0E0]"
          : (isFullscreen ? "bg-[#f8f5f0]" : "bg-[#f3efe9]") + " text-gray-900"
      } transition-colors duration-300 ${isAndroid ? "android-typewriter" : ""} ${isFullscreen && isAndroid ? "fullscreen" : ""} ${orientation}`}
      data-mode={mode}
      data-device-category={deviceCategory}
      data-fullscreen={isFullscreen ? "true" : "false"}
      style={{
        overflow: "hidden",
        ...(isAndroid && isKeyboardVisibleAndroid ? { paddingBottom: `${keyboardHeight}px` } : {}),
      }}
    >
      <ApiKeyWarning />
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
            mode={mode}
            selectedLineIndex={selectedLineIndex}
            isFullscreen={isFullscreen}
            linesContainerRef={linesContainerRef}
          />
        </section>
      </main>
      {!(isFullscreen && isSmallScreen) && (
        <footer
          className={`p-3 border-t ${
            darkMode ? "border-gray-700 text-gray-400 bg-gray-900" : "border-[#d3d0cb] text-gray-600"
          } text-center text-sm font-sans`}
        >
          Typewriter — Konzentriere dich auf dein Schreiben
        </footer>
      )}

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
      <OfflineIndicator darkMode={darkMode} />
    </div>
  )
}
