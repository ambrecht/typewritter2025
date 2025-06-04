"use client"

import type React from "react"

import { AlignLeft, FileText, Fullscreen, Settings, Moon, Sun, Copy, Minimize2, Save, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTypewriterStore } from "@/store/typewriter-store"
import { useState, useEffect, useCallback } from "react"
import { useKeyboard } from "@/hooks/use-keyboard"

interface ControlBarProps {
  wordCount: number
  pageCount: number
  toggleFullscreen: () => void
  hiddenInputRef: React.RefObject<HTMLTextAreaElement | null>
  isFullscreen?: boolean
  openSettings: () => void
}

export default function ControlBar({
  wordCount,
  pageCount,
  toggleFullscreen,
  hiddenInputRef,
  isFullscreen = false,
  openSettings,
}: ControlBarProps) {
  const { darkMode, toggleDarkMode, lines, activeLine, saveSession, loadLastSession, isSaving, isLoading } =
    useTypewriterStore()
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

    // Setze kompakte Ansicht für kleine Bildschirme
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

  // Neue Funktion zum Refokussieren des Eingabefelds nach Button-Aktionen
  const refocusInput = useCallback(() => {
    // Kurze Verzögerung, um sicherzustellen, dass die Button-Aktion abgeschlossen ist
    setTimeout(() => {
      if (isAndroid) {
        // Verwende die Android-optimierte Fokus-Funktion
        if (hiddenInputRef.current) {
          hiddenInputRef.current.focus()
          // Stelle sicher, dass der Cursor am Ende des Textes ist
          const length = hiddenInputRef.current.value.length
          hiddenInputRef.current.setSelectionRange(length, length)
        }
      } else {
        // Standard-Fokus für andere Geräte
        showKeyboard()
      }
    }, 150) // 150ms Verzögerung für bessere Zuverlässigkeit
  }, [isAndroid, hiddenInputRef, showKeyboard])

  // Copy text to clipboard
  const copyToClipboard = () => {
    const fullText = [...lines.map((line) => line.text), activeLine].join("\n")

    // Verwende eine Android-freundliche Methode zum Kopieren
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(fullText)
        .then(() => {
          setCopied(true)
          setTimeout(() => setCopied(false), 2000)
          refocusInput() // Fokus zurücksetzen
        })
        .catch((err) => {
          console.error("Copy error:", err)
          // Fallback für ältere Android-Geräte
          fallbackCopy(fullText)
        })
    } else {
      fallbackCopy(fullText)
    }
  }

  // Fallback-Kopiermethode für ältere Android-Geräte
  const fallbackCopy = (text: string) => {
    try {
      // Erstelle ein temporäres Textarea-Element
      const textarea = document.createElement("textarea")
      textarea.value = text

      // Stelle sicher, dass es nicht sichtbar ist
      textarea.style.position = "fixed"
      textarea.style.opacity = "0"

      document.body.appendChild(textarea)
      textarea.focus()
      textarea.select()

      // Versuche zu kopieren
      const successful = document.execCommand("copy")

      if (successful) {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }

      document.body.removeChild(textarea)
      refocusInput() // Fokus zurücksetzen
    } catch (err) {
      console.error("Fallback copy error:", err)
    }
  }

  // Öffne Einstellungen und blende die Tastatur aus
  const handleOpenSettings = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    // Tastatur ausblenden
    hideKeyboard()

    // Debug-Log
    console.log("Einstellungen-Button in ControlBar geklickt")

    // Einstellungen über die Callback-Funktion öffnen
    openSettings()
  }

  // Speichern-Funktion
  const handleSave = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    // Speichern starten
    await saveSession()
    refocusInput() // Fokus zurücksetzen
  }

  // Laden-Funktion
  const handleLoad = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    // Laden starten
    await loadLastSession()
    refocusInput() // Fokus zurücksetzen
  }

  // Für Android und kleine Bildschirme: Buttons ohne Text und kleiner
  const buttonSize = isSmallScreen ? "xs" : "sm"
  const buttonClass = `${
    darkMode ? "bg-gray-700 hover:bg-gray-600 text-gray-200" : "bg-[#d3d0cb] hover:bg-[#c4c1bc] text-[#222]"
  } font-serif ${isAndroid ? "min-h-[36px] min-w-[36px]" : ""}`

  // Im Vollbildmodus und auf kleinen Bildschirmen: Buttons in die rechte obere Ecke
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

        {/* Speicher Button */}
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

        {/* Laden Button */}
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

  // Standardansicht für größere Bildschirme oder nicht-Vollbildmodus
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

        {/* Speicher Button */}
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

        {/* Laden Button */}
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
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            toggleFullscreen()
            setTimeout(() => {
              refocusInput() // Fokus zurücksetzen mit etwas Verzögerung für Fullscreen-Änderung
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

        {/* Einstellungen Button */}
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
