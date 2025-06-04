"use client"

import type React from "react"

import { useEffect, useState, useCallback } from "react"

interface UseMobileKeyboardOptions {
  hiddenInputRef: React.RefObject<HTMLTextAreaElement | null>
  isAndroid?: boolean
}

/**
 * Hook für die Verwaltung der mobilen Tastatur
 *
 * @param options - Optionen für die mobile Tastatur
 * @returns Funktionen und Zustände für die mobile Tastatur
 */
export function useMobileKeyboard({ hiddenInputRef, isAndroid = false }: UseMobileKeyboardOptions) {
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false)
  const [containerHeight, setContainerHeight] = useState<number | null>(null)

  // Verbesserte Tastaturerkennung für mobile Geräte
  useEffect(() => {
    if (typeof window === "undefined") return

    const checkKeyboard = () => {
      // Auf mobilen Geräten ist die Tastatur sichtbar, wenn die Fensterhöhe deutlich kleiner ist als die Bildschirmhöhe
      const windowHeight = window.innerHeight
      const screenHeight = window.screen.height
      const threshold = screenHeight * 0.15 // 15% Schwellenwert für Tastaturerkennung

      const newIsKeyboardVisible = windowHeight < screenHeight - threshold

      if (newIsKeyboardVisible !== isKeyboardVisible) {
        setIsKeyboardVisible(newIsKeyboardVisible)

        // Auf mobilen Geräten: Scrolle zum Eingabefeld, wenn die Tastatur erscheint
        if (newIsKeyboardVisible && hiddenInputRef.current) {
          setTimeout(() => {
            hiddenInputRef.current?.scrollIntoView({ behavior: "auto", block: "center" })
          }, 100)
        }
      }
    }

    // Prüfe initial und bei Größenänderungen
    checkKeyboard()
    window.addEventListener("resize", checkKeyboard)

    return () => {
      window.removeEventListener("resize", checkKeyboard)
    }
  }, [isKeyboardVisible, hiddenInputRef, isAndroid])

  // Verbesserte Höhenanpassung für mobile Geräte
  useEffect(() => {
    const containerRef = hiddenInputRef.current?.parentElement?.parentElement
    if (!containerRef) return

    if (isKeyboardVisible && containerHeight) {
      // Wenn die Tastatur sichtbar ist, stelle sicher, dass der Container seine Höhe behält
      containerRef.style.height = `${containerHeight}px`
    } else {
      // Wenn die Tastatur nicht sichtbar ist, setze die Höhe zurück
      containerRef.style.height = ""
    }
  }, [isKeyboardVisible, containerHeight, hiddenInputRef])

  // Funktion zum Anpassen der Ansicht für die Tastatur
  const adjustViewForKeyboard = useCallback(() => {
    // Verzögerung, um sicherzustellen, dass die Tastatur vollständig geöffnet ist
    setTimeout(
      () => {
        if (hiddenInputRef.current) {
          hiddenInputRef.current.scrollIntoView({
            behavior: isAndroid ? "auto" : "smooth", // Schnelleres Scrollen auf Android
            block: "center",
          })
        }
      },
      isAndroid ? 100 : 300,
    ) // Kürzere Verzögerung auf Android
  }, [hiddenInputRef, isAndroid])

  // Event-Listener für Fokus auf das Eingabefeld
  useEffect(() => {
    if (typeof window === "undefined") return

    const handleFocus = () => {
      adjustViewForKeyboard()
    }

    // Event-Listener für Größenänderungen (Tastatur erscheint/verschwindet)
    const handleResize = () => {
      if (document.activeElement === hiddenInputRef.current) {
        adjustViewForKeyboard()
      }
    }

    // Event-Listener registrieren
    if (hiddenInputRef.current) {
      hiddenInputRef.current.addEventListener("focus", handleFocus)
      window.addEventListener("resize", handleResize)
    }

    // Event-Listener entfernen
    return () => {
      if (hiddenInputRef.current) {
        hiddenInputRef.current.removeEventListener("focus", handleFocus)
      }
      window.removeEventListener("resize", handleResize)
    }
  }, [adjustViewForKeyboard, hiddenInputRef])

  return {
    isKeyboardVisible,
    adjustViewForKeyboard,
  }
}
