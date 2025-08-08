"use client"

import type React from "react"

import { useCallback, useEffect } from "react"
import { useTypewriterStore } from "@/store/typewriter-store"

interface UseKeyboardNavigationOptions {
  hiddenInputRef: React.RefObject<HTMLTextAreaElement | null>
  isAndroid?: boolean
  navigateUp?: () => void
  navigateDown?: () => void
  resetNavigation?: () => void
}

/**
 * Hook für die Tastaturnavigation im Typewriter
 *
 * @param options - Optionen für die Tastaturnavigation
 * @returns Funktionen für die Tastaturnavigation
 */
export function useKeyboardNavigation({
  hiddenInputRef,
  isAndroid = false,
  navigateUp,
  navigateDown,
  resetNavigation,
}: UseKeyboardNavigationOptions) {
  const { mode, selectedLineIndex } = useTypewriterStore()

  // Fokussiere das Eingabefeld
  const focusInput = useCallback(() => {
    if (!hiddenInputRef.current) return

    // Auf Android: Verzögere den Fokus, um Probleme mit der virtuellen Tastatur zu vermeiden
    if (isAndroid) {
      setTimeout(() => {
        hiddenInputRef.current?.focus()

        // Stelle sicher, dass der Cursor am Ende des Textes ist
        if (hiddenInputRef.current) {
          const length = hiddenInputRef.current.value.length
          hiddenInputRef.current.setSelectionRange(length, length)
        }
      }, 100)
    } else {
      hiddenInputRef.current.focus()

      // Stelle sicher, dass der Cursor am Ende des Textes ist
      const length = hiddenInputRef.current.value.length
      hiddenInputRef.current.setSelectionRange(length, length)
    }
  }, [hiddenInputRef, isAndroid])

  // Fokussiere das Eingabefeld, wenn wir in den Schreibmodus zurückkehren
  useEffect(() => {
    if (mode === "write" && selectedLineIndex === null) {
      focusInput()
    }
  }, [mode, selectedLineIndex, focusInput])

  return {
    focusInput,
  }
}
