"use client"

import type React from "react"

import { useState, useEffect, useCallback, useRef } from "react"

interface UseAndroidKeyboardOptions {
  inputRef: React.RefObject<HTMLTextAreaElement | null>
}

/**
 * Hook zur Verwaltung der Android-Tastatur und -Höhe
 *
 * @param options - Optionen für den Hook
 * @returns Funktionen und Zustände für die Android-Tastatur
 */
export function useAndroidKeyboard({ inputRef }: UseAndroidKeyboardOptions) {
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false)
  const [keyboardHeight, setKeyboardHeight] = useState(0)

  // Ref für die letzte Fensterhöhe
  const lastWindowHeight = useRef(0)

  // Funktion zum sicheren Fokussieren des Eingabefelds
  const focusInputSafely = useCallback(() => {
    if (!inputRef.current) return

    // Verzögere den Fokus, um Probleme mit der virtuellen Tastatur zu vermeiden
    setTimeout(() => {
      try {
        inputRef.current?.focus()

        // Stelle sicher, dass der Cursor am Ende des Textes ist
        const length = inputRef.current.value.length
        inputRef.current.setSelectionRange(length, length)
      } catch (error) {
        console.error("Error focusing input:", error)
      }
    }, 100)
  }, [inputRef])

  // Tastaturerkennung und Höhenberechnung
  useEffect(() => {
    if (typeof window === "undefined") return

    const checkKeyboardVisibility = () => {
      const visualViewport = window.visualViewport
      const windowHeight = window.innerHeight

      // Initialisiere die letzte Fensterhöhe
      if (lastWindowHeight.current === 0) {
        lastWindowHeight.current = windowHeight
      }

      // Berechne die Tastaturhöhe
      let newKeyboardHeight = 0
      if (visualViewport) {
        newKeyboardHeight = windowHeight - visualViewport.height
      } else {
        // Fallback für ältere Browser ohne VisualViewport API
        const screenHeight = window.screen.height
        const threshold = screenHeight * 0.15 // 15% Schwellenwert für Tastaturerkennung
        if (windowHeight < screenHeight - threshold) {
          newKeyboardHeight = screenHeight - windowHeight
        }
      }

      // Aktualisiere den Tastaturstatus und die Höhe
      const newIsKeyboardVisible = newKeyboardHeight > 0
      setIsKeyboardVisible(newIsKeyboardVisible)
      setKeyboardHeight(newKeyboardHeight)
      lastWindowHeight.current = windowHeight
    }

    // Prüfe initial und bei Größenänderungen
    checkKeyboardVisibility()
    window.addEventListener("resize", checkKeyboardVisibility)
    window.addEventListener("visualviewportresize", checkKeyboardVisibility)

    return () => {
      window.removeEventListener("resize", checkKeyboardVisibility)
      window.removeEventListener("visualviewportresize", checkKeyboardVisibility)
    }
  }, [])

  return {
    isKeyboardVisible,
    keyboardHeight,
    focusInputSafely,
  }
}
