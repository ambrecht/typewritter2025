"use client"

interface NavigationHintProps {
  darkMode: boolean
}

/**
 * Komponente für den Pfeiltasten-Hinweis
 */
export function NavigationHint({ darkMode }: NavigationHintProps) {
  return (
    <div
      className={`p-2 rounded-lg ${
        darkMode ? "bg-gray-700 text-gray-200" : "bg-gray-200 text-gray-800"
      } text-xs opacity-80`}
    >
      <div className="flex flex-col gap-1">
        <span>↑↓ Zeilen navigieren</span>
        <span>←→ 10 Zeilen vor/zurück</span>
      </div>
    </div>
  )
}
