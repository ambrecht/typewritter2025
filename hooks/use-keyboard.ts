"use client"

import type React from "react"
import { useCallback } from "react"

interface UseKeyboardOptions {
  inputRef: React.RefObject<HTMLTextAreaElement | null> // Geändert von HTMLInputElement zu HTMLTextAreaElement
  isAndroid?: boolean
}

/**
 * Hook für die Verwaltung der Tastatur, insbesondere auf mobilen Geräten
 *
 * @param options - Optionen für den Keyboard-Hook
 * @returns Funktionen zum Ein- und Ausblenden der Tastatur
 */
export function useKeyboard({ inputRef, isAndroid = false }: UseKeyboardOptions) {
  /**
   * Blendet die Tastatur aus
   */
  const hideKeyboard = useCallback(() => {
    // Robust check for both the ref object and its current property
    if (!inputRef || !inputRef.current) return

    // Methode 1: Blur auf das Input-Element anwenden
    inputRef.current.blur()

    // Methode 2: Fokus auf ein anderes, nicht-editierbares Element setzen
    const dummyElement = document.createElement("div")
    dummyElement.setAttribute("tabindex", "-1")
    document.body.appendChild(dummyElement)
    dummyElement.focus()
    document.body.removeChild(dummyElement)

    // Methode 3: Für Android-spezifische Lösungen
    if (isAndroid) {
      // Versuche, die Tastatur mit einem speziellen Android-Hack zu schließen
      // Setze das Input-Element kurzzeitig auf readonly
      const originalReadOnly = inputRef.current.readOnly
      inputRef.current.readOnly = true

      // Und stelle es nach einer kurzen Verzögerung wieder her
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.readOnly = originalReadOnly
        }
      }, 100)
    }
  }, [inputRef, isAndroid])

  /**
   * Zeigt die Tastatur an
   */
  const showKeyboard = useCallback(() => {
    // Robust check for both the ref object and its current property
    if (!inputRef || !inputRef.current) return

    // Fokussiere das Input-Element
    inputRef.current.focus()

    // Auf Android: Versuche, die Tastatur zu erzwingen
    if (isAndroid) {
      // Simuliere eine Benutzerinteraktion
      inputRef.current.click()

      // Oder versuche es mit einer kurzen Verzögerung
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    }
  }, [inputRef, isAndroid])

  return {
    hideKeyboard,
    showKeyboard,
  }
}
