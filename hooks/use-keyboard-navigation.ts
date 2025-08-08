"use client"

import type React from "react"

import { useCallback, useEffect } from "react"
import { useTypewriterStore } from "@/store/typewriter-store"

interface UseKeyboardNavigationOptions {
  hiddenInputRef: React.RefObject<HTMLTextAreaElement | null>
  isAndroid?: boolean
  onNavigate?: () => void
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
  onNavigate,
}: UseKeyboardNavigationOptions) {
  const { navMode, setNavMode, navigateUp, navigateDown, setOffset } =
    useTypewriterStore()

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

  // Globale Tastatur-Events für Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp" || e.key === "ArrowDown") {
        if (!navMode) {
          setNavMode(true)
        }
        e.preventDefault()
        onNavigate?.()
        if (e.key === "ArrowUp") navigateUp()
        if (e.key === "ArrowDown") navigateDown()
        return
      }

      if (!navMode) return

      if (e.key === "Escape") {
        e.preventDefault()
        setNavMode(false)
        setOffset(0)
        focusInput()
        return
      }

      if (e.key.length === 1) {
        setNavMode(false)
        setOffset(0)
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [navMode, navigateUp, navigateDown, setNavMode, setOffset, onNavigate, focusInput])

  // Fokussiere das Eingabefeld, wenn der Navigationsmodus beendet wird
  useEffect(() => {
    if (!navMode) {
      focusInput()
    }
  }, [navMode, focusInput])

  return {
    focusInput,
    setNavMode,
  }
}
