"use client"

import { useCallback } from "react"
import type { Line } from "@/types"

interface CopyButtonProps {
  lines: Line[]
  activeLine: string
  darkMode: boolean
}

/**
 * Komponente für den Kopier-Button
 */
export function CopyButton({ lines, activeLine, darkMode }: CopyButtonProps) {
  /**
   * Funktion zum Kopieren des gesamten Textes
   */
  const copyAllText = useCallback(() => {
    const allText =
      lines.map((l) => l.text).join("\n") + (activeLine ? "\n" + activeLine : "")
    navigator.clipboard
      .writeText(allText)
      .then(() => {
        // Optional: Feedback für den Benutzer
        alert("Text wurde in die Zwischenablage kopiert!")
      })
      .catch((err) => {
        console.error("Fehler beim Kopieren: ", err)
      })
  }, [lines, activeLine])

  return (
    <button
      onClick={copyAllText}
      className={`p-2 rounded-full ${
        darkMode ? "bg-gray-700 text-gray-200 hover:bg-gray-600" : "bg-gray-200 text-gray-800 hover:bg-gray-300"
      }`}
      aria-label="Gesamten Text kopieren"
      title="Gesamten Text kopieren"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
      </svg>
    </button>
  )
}
