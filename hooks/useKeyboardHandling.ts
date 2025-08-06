"use client"

import type React from "react"

import { useCallback, useState, useEffect } from "react"
import type { ChangeEvent, KeyboardEvent } from "react"
import type { LineBreakConfig } from "@/types"
import { breakTextIntoLines } from "@/utils/line-break-utils"

/**
 * Hook zur Verwaltung der Tastatureingaben und Keyboard-Erkennung
 *
 * @param params - Parameter für die Tastaturverwaltung
 * @returns Objekt mit Funktionen und Zuständen für die Tastaturverwaltung
 */
export function useKeyboardHandling({
  setActiveLine,
  addLineToStack,
  lineBreakConfig,
  hiddenInputRef,
  linesContainerRef,
  disableBackspace = false,
}: {
  setActiveLine: (line: string) => void
  addLineToStack: () => void
  lineBreakConfig: LineBreakConfig
  hiddenInputRef: React.RefObject<HTMLTextAreaElement | null>
  linesContainerRef: React.RefObject<HTMLDivElement | null>
  disableBackspace?: boolean
}) {
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false)
  const [containerHeight, setContainerHeight] = useState<number | null>(null)
  const [isAndroid, setIsAndroid] = useState(false)

  // Überprüfen, ob es sich um ein Android-Gerät handelt
  useEffect(() => {
    const isAndroidDevice = /Android/.test(navigator.userAgent)
    setIsAndroid(isAndroidDevice)
  }, [])

  /**
   * Behandelt Änderungen im versteckten Eingabefeld
   */
  const handleChange = useCallback(
    (e: ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value
      const oldValue = hiddenInputRef.current?.defaultValue || ""

      // Spiele den Typewriter-Sound ab, wenn Text hinzugefügt wurde
      // Note: We're not playing sound here anymore since we play it on keydown
      // for better responsiveness

      const brokenLines = breakTextIntoLines(newValue, lineBreakConfig)

      if (brokenLines.length > 1) {
        // Add all segments except the last one as completed lines
        brokenLines.slice(0, -1).forEach((segment) => {
          setActiveLine(segment)
          addLineToStack()
        })
        // Keep the last segment as the active line
        setActiveLine(brokenLines[brokenLines.length - 1])
      } else {
        setActiveLine(newValue)
      }

      // Aktualisiere den defaultValue für den nächsten Vergleich
      if (hiddenInputRef.current) {
        hiddenInputRef.current.defaultValue = newValue
      }
    },
    [setActiveLine, addLineToStack, lineBreakConfig, hiddenInputRef],
  )

  /**
   * Behandelt Tastatureingaben im versteckten Eingabefeld
   */
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      // Backspace/Delete deaktivieren, wenn Flow Mode aktiv ist
      if (disableBackspace && (e.key === "Backspace" || e.key === "Delete")) {
        e.preventDefault()
        return
      }

      // Enter-Taste: Neue Zeile hinzufügen
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault()

        addLineToStack()

        // Auf Android: Verzögere den Fokus, um Probleme mit der virtuellen Tastatur zu vermeiden
        if (isAndroid) {
          setTimeout(() => {
            if (hiddenInputRef.current) {
              hiddenInputRef.current.focus()
            }
          }, 50)
        }
        return
      }

      // Shift+Enter: Zeilenumbruch innerhalb der aktuellen Zeile
      if (e.key === "Enter" && e.shiftKey) {
        // Lasse den Standard-Zeilenumbruch zu
        return
      }
    },
    [addLineToStack, isAndroid, hiddenInputRef, disableBackspace],
  )

  // Verbesserte Tastaturerkennung für Android
  useEffect(() => {
    if (typeof window === "undefined") return

    const checkKeyboard = () => {
      // Auf Android ist die Tastatur sichtbar, wenn die Fensterhöhe deutlich kleiner ist als die Bildschirmhöhe
      const windowHeight = window.innerHeight
      const screenHeight = window.screen.height
      const threshold = screenHeight * 0.15 // 15% Schwellenwert für Tastaturerkennung

      const newIsKeyboardVisible = windowHeight < screenHeight - threshold
      setIsKeyboardVisible(newIsKeyboardVisible)

      // Speichere die Containerhöhe, wenn die Tastatur nicht sichtbar ist
      if (!newIsKeyboardVisible && linesContainerRef.current) {
        setContainerHeight(linesContainerRef.current.clientHeight)
      }
    }

    // Prüfe initial und bei Größenänderungen
    checkKeyboard()
    window.addEventListener("resize", checkKeyboard)

    return () => {
      window.removeEventListener("resize", checkKeyboard)
    }
  }, [linesContainerRef])

  // Verbesserte Höhenanpassung für Android
  useEffect(() => {
    if (!linesContainerRef.current) return

    if (isKeyboardVisible && containerHeight) {
      // Wenn die Tastatur sichtbar ist, stelle sicher, dass der Container seine Höhe behält
      linesContainerRef.current.style.height = `${containerHeight}px`
    } else {
      // Wenn die Tastatur nicht sichtbar ist, setze die Höhe zurück
      linesContainerRef.current.style.height = ""
    }
  }, [isKeyboardVisible, containerHeight, linesContainerRef])

  return {
    handleChange,
    handleKeyDown,
    isKeyboardVisible,
    isAndroid,
  }
}
