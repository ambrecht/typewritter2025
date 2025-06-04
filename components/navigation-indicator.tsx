"use client"

import { useTypewriterStore } from "@/store/typewriter-store"

interface NavigationIndicatorProps {
  darkMode: boolean
}

/**
 * Zeigt einen Indikator für die aktuelle Navigation an
 */
export default function NavigationIndicator({ darkMode }: NavigationIndicatorProps) {
  const { mode, selectedLineIndex, lines } = useTypewriterStore()

  // Wenn wir nicht im Navigationsmodus sind oder keine Zeile ausgewählt ist, zeige nichts an
  if (mode !== "navigating" || selectedLineIndex === null) return null

  return (
    <div
      className={`fixed bottom-20 right-4 p-2 rounded-lg shadow-lg z-50 ${
        darkMode ? "bg-gray-800 text-gray-200" : "bg-white text-gray-800"
      }`}
    >
      <div className="text-sm font-medium">
        Zeile {selectedLineIndex + 1} von {lines.length}
      </div>
    </div>
  )
}
