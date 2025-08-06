"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import {
  AlignLeft,
  FileText,
  Fullscreen,
  Settings,
  Moon,
  Sun,
  Copy,
  Minimize2,
  Save,
  Download,
  Trash2,
  Rocket,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTypewriterStore } from "@/store/typewriter-store"
import { useKeyboard } from "@/hooks/use-keyboard"

// Helper to detect touch-capable devices
function detectTouchDevice() {
  return (
    typeof window !== "undefined" &&
    ("ontouchstart" in window || navigator.maxTouchPoints > 0)
  )
}

interface ControlBarProps {
  wordCount: number
  pageCount: number
  toggleFullscreen: () => void
  hiddenInputRef: React.RefObject<HTMLTextAreaElement | null>
  isFullscreen?: boolean
  openSettings: () => void
  openFlowSettings: () => void
}

function ControlBar({
  wordCount,
  pageCount,
  toggleFullscreen,
  hiddenInputRef,
  isFullscreen = false,
  openSettings,
  openFlowSettings,
}: ControlBarProps) {
  const {
    darkMode,
    toggleDarkMode,
    lines,
    activeLine,
    saveSession,
    loadLastSession,
    isSaving,
    isLoading,
    resetSession,
  } = useTypewriterStore()

  const [isCompactView, setIsCompactView] = useState(false)
  const [copied, setCopied] = useState(false)
  const [isAndroid, setIsAndroid] = useState(false)
  const [isSmallScreen, setIsSmallScreen] = useState(false)
  const [isTouchDeviceState, setIsTouchDevice] = useState(false)
  const [isVeryNarrowScreen, setIsVeryNarrowScreen] = useState(false)

  // Keyboard-Hook verwenden
  const { hideKeyboard, showKeyboard } = useKeyboard({
    inputRef: hiddenInputRef,
    isAndroid,
  })

  // Geräte- und Bildschirmgrößenerkennung
  useEffect(() => {
    const isAndroidDevice = /Android/.test(navigator.userAgent)
    setIsAndroid(isAndroidDevice)
    setIsTouchDevice(detectTouchDevice())

    const handleResize = () => {
      setIsCompactView(window.innerWidth < 640)
      setIsSmallScreen(window.innerWidth < 768 || isAndroidDevice)
      setIsVeryNarrowScreen(
        window.innerWidth < 400 && window.innerHeight > window.innerWidth,
      )
    }

    handleResize()
    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
    }
  }, [])

  // Refokussieren des Eingabefelds nach Button-Aktionen
  const refocusInput = useCallback(() => {
    setTimeout(() => {
      if (hiddenInputRef.current) {
        hiddenInputRef.current.focus()
        if (isAndroid) {
          const length = hiddenInputRef.current.value.length
          hiddenInputRef.current.setSelectionRange(length, length)
        }
      }
    }, 150)
  }, [isAndroid, hiddenInputRef])

  // Copy text to clipboard
  const copyToClipboard = () => {
    const fullText = [...lines.map((l) => l.text), activeLine].join("\n")

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(fullText)
        .then(() => {
          setCopied(true)
          setTimeout(() => setCopied(false), 2000)
          refocusInput()
        })
        .catch((err) => {
          console.error("Copy error:", err)
          fallbackCopy(fullText)
        })
    } else {
      fallbackCopy(fullText)
    }
  }

  // Fallback-Kopiermethode für ältere Android-Geräte
  const fallbackCopy = (text: string) => {
    try {
      const textarea = document.createElement("textarea")
      textarea.value = text
      textarea.style.position = "fixed"
      textarea.style.opacity = "0"

      document.body.appendChild(textarea)
      textarea.focus()
      textarea.select()

      const successful = document.execCommand("copy")

      if (successful) {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }

      document.body.removeChild(textarea)
      refocusInput()
    } catch (err) {
      console.error("Fallback copy error:", err)
    }
  }

  // Event Handler
  const handleOpenSettings = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    hideKeyboard()
    openSettings()
  }

  const handleOpenFlowSettings = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    hideKeyboard()
    openFlowSettings()
  }

  const handleSave = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    await saveSession()
    refocusInput()
  }

  const handleLoad = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    await loadLastSession()
    refocusInput()
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const confirmed = window.confirm(
      "Möchten Sie wirklich alle Zeilen löschen? Diese Aktion kann nicht rückgängig gemacht werden.",
    )

    if (confirmed) {
      resetSession()
      refocusInput()
    }
  }

  // Button-Styling
  const buttonSize = isSmallScreen ? "xs" : "sm"
  const touchSize =
    isTouchDeviceState || isAndroid || isVeryNarrowScreen
      ? "min-h-[44px] min-w-[44px]"
      : ""
  const buttonClass = `${
    darkMode ? "bg-gray-700 hover:bg-gray-600 text-gray-200" : "bg-[#d3d0cb] hover:bg-[#c4c1bc] text-[#222]"
  } font-serif ${touchSize}`

  // Button definitions
  const primaryButtons = [
    {
      icon: <Copy className="h-4 w-4" />,
      label: copied ? "Kopiert!" : "Kopieren",
      action: copyToClipboard,
      aria: "Kopieren",
    },
    {
      icon: <Save className={`h-4 w-4 ${isSaving ? "animate-pulse" : ""}`} />,
      label: isSaving ? "Speichern..." : "Speichern",
      action: handleSave,
      disabled: isSaving,
      aria: "Speichern",
    },
    {
      icon: <Download className={`h-4 w-4 ${isLoading ? "animate-pulse" : ""}`} />,
      label: isLoading ? "Laden..." : "Laden",
      action: handleLoad,
      disabled: isLoading,
      aria: "Letzte Sitzung laden",
    },
  ]

  const secondaryButtons = [
    {
      icon: <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />,
      label: "Löschen",
      action: handleDelete,
      className: "hover:bg-red-100 dark:hover:bg-red-900",
      aria: "Alle Zeilen löschen",
    },
    {
      icon: isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Fullscreen className="h-4 w-4" />,
      label: isFullscreen ? "Vollbild beenden" : "Vollbild",
      action: () => {
        toggleFullscreen()
        setTimeout(() => {
          refocusInput()
        }, 300)
      },
      aria: isFullscreen ? "Vollbild beenden" : "Vollbild",
    },
    {
      icon: darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />,
      label: darkMode ? "Hellmodus" : "Dunkelmodus",
      action: toggleDarkMode,
      aria: darkMode ? "Zum hellen Modus wechseln" : "Zum dunklen Modus wechseln",
    },
    {
      icon: <Settings className="h-4 w-4" />,
      label: "Einstellungen",
      action: handleOpenSettings,
      aria: "Einstellungen",
    },
  ]

  const renderButtonGroup = (buttons: any[], showLabels = true) => (
    <div className={`flex ${isVeryNarrowScreen ? "gap-1" : "gap-2"}`}>
      {buttons.map((btn, index) => (
        <Button
          key={index}
          variant="outline"
          size={buttonSize}
          onClick={(e: React.MouseEvent) => {
            e.preventDefault()
            e.stopPropagation()
            btn.action(e)
          }}
          disabled={btn.disabled}
          className={`${buttonClass} ${btn.className || ""}`}
          aria-label={btn.aria}
          title={btn.aria}
        >
          {btn.icon}
          {showLabels && !isSmallScreen && <span className="ml-1">{btn.label}</span>}
        </Button>
      ))}
    </div>
  )


  // Standard-Layout
  return (
    <div
      className={`flex flex-wrap items-center justify-between p-2 sm:p-3 ${
        darkMode ? "text-gray-200 bg-gray-900" : "text-[#222] bg-[#f3efe9]"
      } text-sm font-serif gap-2`}
    >
      {/* Statistics */}
      <div className="flex items-center gap-2 sm:gap-6">
        <div className="flex items-center gap-1 sm:gap-2">
          <AlignLeft className={`h-4 w-4 ${darkMode ? "text-gray-400" : "text-gray-600"}`} />
          <span className="whitespace-nowrap">{isCompactView ? wordCount : `Wörter: ${wordCount}`}</span>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <FileText className={`h-4 w-4 ${darkMode ? "text-gray-400" : "text-gray-600"}`} />
          <span className="whitespace-nowrap">{isCompactView ? pageCount : `Seiten: ${pageCount}`}</span>
        </div>
      </div>

      {/* Controls */}
      {isVeryNarrowScreen ? (
        <div className="flex flex-col w-full gap-2 mt-2">
          <div className="flex justify-center gap-2">
            {renderButtonGroup(primaryButtons, false)}
          </div>
          <div className="flex justify-center gap-2 overflow-x-auto pb-1">
            {renderButtonGroup(secondaryButtons, false)}
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          {renderButtonGroup(primaryButtons)}
          {renderButtonGroup(secondaryButtons)}
        </div>
      )}
    </div>
  )
}

export default ControlBar
