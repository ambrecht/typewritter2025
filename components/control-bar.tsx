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
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTypewriterStore } from "@/store/typewriter-store"
import { useKeyboard } from "@/hooks/use-keyboard"

interface ControlBarProps {
  wordCount: number
  pageCount: number
  toggleFullscreen: () => void
  hiddenInputRef: React.RefObject<HTMLTextAreaElement | null>
  isFullscreen?: boolean
  openSettings: () => void
}

function ControlBar({
  wordCount,
  pageCount,
  toggleFullscreen,
  hiddenInputRef,
  isFullscreen = false,
  openSettings,
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

  // Keyboard-Hook verwenden
  const { hideKeyboard, showKeyboard } = useKeyboard({
    inputRef: hiddenInputRef,
    isAndroid,
  })

  // Überprüfen, ob es sich um ein Android-Gerät handelt und Bildschirmgröße überwachen
  useEffect(() => {
    const isAndroidDevice = /Android/.test(navigator.userAgent)
    setIsAndroid(isAndroidDevice)

    const handleResize = () => {
      setIsCompactView(window.innerWidth < 640)
      setIsSmallScreen(window.innerWidth < 768 || isAndroidDevice)
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
      if (isAndroid) {
        if (hiddenInputRef.current) {
          hiddenInputRef.current.focus()
          const length = hiddenInputRef.current.value.length
          hiddenInputRef.current.setSelectionRange(length, length)
        }
      } else {
        showKeyboard()
      }
    }, 150)
  }, [isAndroid, hiddenInputRef, showKeyboard])

  // Copy text to clipboard
  const copyToClipboard = () => {
    const fullText = [...lines.map((line) => line.text), activeLine].join("\n")

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
  const buttonClass = `${
    darkMode ? "bg-gray-700 hover:bg-gray-600 text-gray-200" : "bg-[#d3d0cb] hover:bg-[#c4c1bc] text-[#222]"
  } font-serif min-h-[48px]`

  // Vollbild-Layout für kleine Bildschirme
  if (isFullscreen && isSmallScreen) {
    return (
      <div
        className={`fixed top-2 right-2 z-50 flex gap-1 rounded-lg p-1 ${
          darkMode ? "bg-gray-800/70 backdrop-blur-sm" : "bg-white/70 backdrop-blur-sm"
        }`}
      >
        <Button
          variant="outline"
          size={buttonSize}
          onClick={copyToClipboard}
          className={buttonClass}
          aria-label="Kopieren"
          title="Kopieren"
        >
          <Copy className="h-4 w-4" />
        </Button>

        <Button
          variant="outline"
          size={buttonSize}
          onClick={handleSave}
          disabled={isSaving}
          className={buttonClass}
          aria-label="Speichern"
          title="Speichern"
        >
          <Save className={`h-4 w-4 ${isSaving ? "animate-pulse" : ""}`} />
        </Button>

        <Button
          variant="outline"
          size={buttonSize}
          onClick={handleLoad}
          disabled={isLoading}
          className={buttonClass}
          aria-label="Letzte Sitzung laden"
          title="Letzte Sitzung laden"
        >
          <Download className={`h-4 w-4 ${isLoading ? "animate-pulse" : ""}`} />
        </Button>

        <Button
          variant="outline"
          size={buttonSize}
          onClick={handleDelete}
          className={`${buttonClass} hover:bg-red-100 dark:hover:bg-red-900`}
          aria-label="Alle Zeilen löschen"
          title="Alle Zeilen löschen"
        >
          <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
        </Button>

        <Button
          variant="outline"
          size={buttonSize}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            toggleFullscreen()
            setTimeout(() => showKeyboard(), 300)
          }}
          className={buttonClass}
          aria-label={isFullscreen ? "Vollbild beenden" : "Vollbild"}
          title={isFullscreen ? "Vollbild beenden" : "Vollbild"}
        >
          {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Fullscreen className="h-4 w-4" />}
        </Button>

        <Button
          variant="outline"
          size={buttonSize}
          onClick={toggleDarkMode}
          className={buttonClass}
          aria-label={darkMode ? "Zum hellen Modus wechseln" : "Zum dunklen Modus wechseln"}
          title={darkMode ? "Zum hellen Modus wechseln" : "Zum dunklen Modus wechseln"}
        >
          {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        <Button
          variant="outline"
          size={buttonSize}
          onClick={handleOpenSettings}
          className={buttonClass}
          aria-label="Einstellungen"
          title="Einstellungen"
        >
          <Settings className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  // Standard-Layout
  return (
    <div
      className={`flex flex-wrap gap-2 sm:gap-4 items-center justify-between p-2 sm:p-3 ${
        darkMode ? "text-gray-200 bg-gray-900" : "text-[#222] bg-[#f3efe9]"
      } text-sm font-serif`}
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
      <div className="flex items-center gap-2 sm:gap-4">
        <Button
          variant="outline"
          size={buttonSize}
          onClick={copyToClipboard}
          className={buttonClass}
          aria-label="Kopieren"
          title="Kopieren"
        >
          <Copy className="h-4 w-4" />
          {!isSmallScreen && <span className="ml-1">{copied ? "Kopiert!" : "Kopieren"}</span>}
        </Button>

        <Button
          variant="outline"
          size={buttonSize}
          onClick={handleSave}
          disabled={isSaving}
          className={buttonClass}
          aria-label="Speichern"
          title="Speichern"
        >
          <Save className={`h-4 w-4 ${isSaving ? "animate-pulse" : ""}`} />
          {!isSmallScreen && <span className="ml-1">{isSaving ? "Speichern..." : "Speichern"}</span>}
        </Button>

        <Button
          variant="outline"
          size={buttonSize}
          onClick={handleLoad}
          disabled={isLoading}
          className={buttonClass}
          aria-label="Letzte Sitzung laden"
          title="Letzte Sitzung laden"
        >
          <Download className={`h-4 w-4 ${isLoading ? "animate-pulse" : ""}`} />
          {!isSmallScreen && <span className="ml-1">{isLoading ? "Laden..." : "Laden"}</span>}
        </Button>

        <Button
          variant="outline"
          size={buttonSize}
          onClick={handleDelete}
          className={`${buttonClass} hover:bg-red-100 dark:hover:bg-red-900`}
          aria-label="Alle Zeilen löschen"
          title="Alle Zeilen löschen"
        >
          <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
          {!isSmallScreen && <span className="ml-1 text-red-600 dark:text-red-400">Löschen</span>}
        </Button>

        <Button
          variant="outline"
          size={buttonSize}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            toggleFullscreen()
            setTimeout(() => {
              refocusInput()
            }, 300)
          }}
          className={buttonClass}
          aria-label={isFullscreen ? "Vollbild beenden" : "Vollbild"}
          title={isFullscreen ? "Vollbild beenden" : "Vollbild"}
        >
          {isFullscreen ? (
            <>
              <Minimize2 className="h-4 w-4" />
              {!isSmallScreen && <span className="ml-1">Vollbild beenden</span>}
            </>
          ) : (
            <>
              <Fullscreen className="h-4 w-4" />
              {!isSmallScreen && <span className="ml-1">Vollbild</span>}
            </>
          )}
        </Button>

        <Button
          variant="outline"
          size={buttonSize}
          onClick={toggleDarkMode}
          className={buttonClass}
          aria-label={darkMode ? "Zum hellen Modus wechseln" : "Zum dunklen Modus wechseln"}
          title={darkMode ? "Zum hellen Modus wechseln" : "Zum dunklen Modus wechseln"}
        >
          {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        <Button
          variant="outline"
          size={buttonSize}
          onClick={handleOpenSettings}
          className={buttonClass}
          aria-label="Einstellungen"
          title="Einstellungen"
        >
          <Settings className="h-4 w-4" />
          {!isSmallScreen && <span className="ml-1">Einstellungen</span>}
        </Button>
      </div>
    </div>
  )
}

export default ControlBar
