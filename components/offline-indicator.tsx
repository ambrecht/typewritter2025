"use client"

import { useState, useEffect } from "react"
import { useTypewriterStore } from "@/store/typewriter-store"

interface OfflineIndicatorProps {
  darkMode: boolean
}

/**
 * Komponente zur Anzeige des Offline-Status und Verwaltung automatischer Backups
 */
export default function OfflineIndicator({ darkMode }: OfflineIndicatorProps) {
  const [isOffline, setIsOffline] = useState(false)
  const [backupStatus, setBackupStatus] = useState<"idle" | "saving" | "saved" | "error">("idle")
  const [lastBackup, setLastBackup] = useState<string | null>(null)

  // Offline-Status überwachen
  useEffect(() => {
    // Initial prüfen
    setIsOffline(!navigator.onLine)

    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  // Automatisches Backup alle 60 Sekunden
  useEffect(() => {
    const backupInterval = setInterval(() => {
      try {
        // Aktuellen Zustand abrufen
        const currentState = useTypewriterStore.getState()
        const timestamp = new Date().toISOString()

        setBackupStatus("saving")

        // In localStorage speichern
        localStorage.setItem(`typewriter-backup-${timestamp}`, JSON.stringify(currentState))

        // Alte Backups aufräumen (max. 5 behalten)
        const backupKeys = Object.keys(localStorage)
          .filter((key) => key.startsWith("typewriter-backup-"))
          .sort()
          .reverse()

        if (backupKeys.length > 5) {
          backupKeys.slice(5).forEach((key) => localStorage.removeItem(key))
        }

        setBackupStatus("saved")
        setLastBackup(new Date().toLocaleTimeString('en-US'))

        // Status nach 3 Sekunden zurücksetzen
        setTimeout(() => {
          setBackupStatus("idle")
        }, 3000)
      } catch (error) {
        console.error("Backup error:", error)
        setBackupStatus("error")
      }
    }, 60000) // Alle 60 Sekunden

    return () => clearInterval(backupInterval)
  }, [])

  // Wenn weder offline noch kürzlich gesichert, nichts anzeigen
  if (!isOffline && backupStatus !== "saving" && backupStatus !== "saved") return null

  return (
    <div
      className={`fixed bottom-28 left-1/2 transform -translate-x-1/2 py-2 px-4 rounded-full z-40 flex items-center gap-2 text-sm transition-opacity duration-300 ${
        darkMode ? "bg-gray-800 text-gray-200" : "bg-white text-gray-800"
      } shadow-lg`}
      style={{ opacity: backupStatus === "idle" && !isOffline ? 0 : 1 }}
    >
      {isOffline && (
        <>
          <span className={`inline-block w-3 h-3 rounded-full ${darkMode ? "bg-amber-500" : "bg-amber-600"}`}></span>
          <span className="font-medium">Offline-Modus</span>
        </>
      )}

      {!isOffline && backupStatus === "saving" && (
        <>
          <span className="inline-block w-3 h-3 rounded-full bg-blue-500 animate-pulse"></span>
          <span className="font-medium">Sichern...</span>
        </>
      )}

      {!isOffline && backupStatus === "saved" && (
        <>
          <span className="inline-block w-3 h-3 rounded-full bg-green-500"></span>
          <span className="font-medium">Gesichert um {lastBackup}</span>
        </>
      )}

      {!isOffline && backupStatus === "error" && (
        <>
          <span className="inline-block w-3 h-3 rounded-full bg-red-500"></span>
          <span className="font-medium">Sicherung fehlgeschlagen</span>
        </>
      )}
    </div>
  )
}
