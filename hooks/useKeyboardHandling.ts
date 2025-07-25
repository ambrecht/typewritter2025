"use client"

import type React from "react"

import { useCallback, useState, useEffect } from "react"
import type { ChangeEvent, KeyboardEvent } from "react"
import type { LineBreakConfig } from "@/types"

/**
 * Hook zur Verwaltung der Tastatureingaben und Keyboard-Erkennung
 *
 * @param params - Parameter für die Tastaturverwaltung
 * @returns Objekt mit Funktionen und Zuständen für die Tastaturverwaltung
 */
export function useKeyboardHandling({
  setActiveLine,
  addLineToStack,
  lineBreakConfig, // This prop is no longer used here but kept for compatibility
  hiddenInputRef,
  linesContainerRef,
}: {
  setActiveLine: (line: string) => void
  addLineToStack: () => void
  lineBreakConfig: LineBreakConfig
  hiddenInputRef: React.RefObject<HTMLTextAreaElement | null>
  linesContainerRef: React.RefObject<HTMLDivElement | null>
}) {
  // ... (state and useEffect for isAndroid remain the same)
  const [isAndroid, setIsAndroid] = useState(false)

  useEffect(() => {
    const isAndroidDevice = /Android/.test(navigator.userAgent)
    setIsAndroid(isAndroidDevice)
  }, [])

  /**
   * Behandelt Änderungen im versteckten Eingabefeld.
   * Die Logik für den Zeilenumbruch wird jetzt im Store (setActiveLine) gehandhabt.
   */
  const handleChange = useCallback(
    (e: ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value
      // The store now handles the logic for breaking lines automatically.
      setActiveLine(newValue)
    },
    [setActiveLine],
  )

  /**
   * Behandelt Tastatureingaben im versteckten Eingabefeld
   */
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      // Enter-Taste: Manuell eine neue Zeile hinzufügen
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault()
        addLineToStack()

        if (isAndroid) {
          setTimeout(() => {
            if (hiddenInputRef.current) {
              hiddenInputRef.current.focus()
            }
          }, 50)
        }
        return
      }

      // Shift+Enter: Zeilenumbruch innerhalb der aktuellen Zeile erlauben
      if (e.key === "Enter" && e.shiftKey) {
        // Standardverhalten der Textarea zulassen
        return
      }
    },
    [addLineToStack, isAndroid, hiddenInputRef],
  )

  // The keyboard visibility and container height logic is removed as it's no longer needed
  // with the new simplified approach.

  return {
    handleChange,
    handleKeyDown,
    isKeyboardVisible: false, // This is no longer tracked here
    isAndroid,
  }
}
