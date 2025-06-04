"use client"

import { useState, useEffect } from "react"

interface NavigationHintProps {
  darkMode: boolean
}

/**
 * Komponente für den Pfeiltasten-Hinweis
 */
export function NavigationHint({ darkMode }: NavigationHintProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Zeige den Hinweis nur, wenn die Maus im oberen Bereich des Fensters ist
      const topThreshold = window.innerHeight * 0.15 // Obere 15% des Fensters
      setIsVisible(e.clientY < topThreshold)
    }

    window.addEventListener("mousemove", handleMouseMove)
    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
    }
  }, [])

  return (
    <div
      className={`absolute top-2 left-2 z-20 p-2 rounded-lg ${
        darkMode ? "bg-gray-700 text-gray-200" : "bg-gray-200 text-gray-800"
      } text-xs transition-opacity duration-300 ${isVisible ? "opacity-80" : "opacity-0"}`}
    >
      <div className="flex flex-col gap-1">
        <span>↑↓ Zeilen navigieren</span>
        <span>←→ 10 Zeilen vor/zurück</span>
      </div>
    </div>
  )
}
