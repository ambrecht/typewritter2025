"use client"

import { useEffect, useState } from "react"
import { useTypewriterStore } from "@/store/typewriter-store"
import { Check, X, AlertCircle } from "lucide-react"

/**
 * Komponente zur Anzeige einer Benachrichtigung nach dem Speichern
 */
export default function SaveNotification() {
  const { lastSaveStatus, darkMode } = useTypewriterStore()
  const [visible, setVisible] = useState(false)

  // Zeige die Benachrichtigung, wenn sich der Speicherstatus ändert
  useEffect(() => {
    if (lastSaveStatus) {
      setVisible(true)

      // Blende die Benachrichtigung nach 3 Sekunden aus
      const timer = setTimeout(() => {
        setVisible(false)
      }, 3000)

      return () => clearTimeout(timer)
    }
  }, [lastSaveStatus])

  // Wenn kein Speicherstatus vorhanden ist oder die Benachrichtigung nicht sichtbar sein soll, zeige nichts an
  if (!lastSaveStatus || !visible) return null

  return (
    <div
      className={`fixed bottom-28 left-1/2 transform -translate-x-1/2 py-2 px-4 rounded-lg z-50 flex items-center gap-2 text-sm transition-opacity duration-300 ${
        darkMode ? "bg-gray-800 text-gray-200" : "bg-white text-gray-800"
      } shadow-lg`}
      style={{ opacity: visible ? 1 : 0 }}
    >
      {lastSaveStatus.success ? (
        <>
          <Check className={`h-4 w-4 ${darkMode ? "text-green-400" : "text-green-600"}`} />
          <span className="font-medium">{lastSaveStatus.message}</span>
        </>
      ) : (
        <>
          <AlertCircle className={`h-4 w-4 ${darkMode ? "text-red-400" : "text-red-600"}`} />
          <span className="font-medium">{lastSaveStatus.message}</span>
        </>
      )}
      <button
        onClick={() => setVisible(false)}
        className="ml-2 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
        aria-label="Schließen"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  )
}
