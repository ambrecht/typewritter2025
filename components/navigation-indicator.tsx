"use client"

import { useTypewriterStore } from "@/store/typewriter-store"

interface NavigationIndicatorProps {
  darkMode: boolean
}

/**
 * Zeigt einen Indikator für die aktuelle Navigation an
 */
export default function NavigationIndicator({ darkMode }: NavigationIndicatorProps) {
  const { mode } = useTypewriterStore()

  // Nur im Navigationsmodus anzeigen
  if (mode !== "nav") return null

  return (
    <div
      className={`p-2 rounded-lg shadow ${
        darkMode ? "bg-gray-800 text-gray-200" : "bg-white text-gray-800"
      }`}
    >
      <div className="text-sm font-medium">Navigationsmodus</div>
    </div>
  )
}
