"use client"

import { useEffect, useState } from "react"
import { useTypewriterStore } from "@/store/typewriter-store"

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
  darkMode: boolean
}

export default function SettingsModal({ isOpen, onClose, darkMode }: SettingsModalProps) {
  const {
    fontSize: storeFontSize,
    stackFontSize: storeStackFontSize,
    setFontSize,
    setStackFontSize,
    lineBreakConfig: storeLineBreakConfig,
    updateLineBreakConfig,
    setFixedLineLength,
  } = useTypewriterStore()

  // LOKALE UI-STATES - Diese werden NICHT bei Store-Updates zurückgesetzt!
  const [localFontSize, setLocalFontSize] = useState(storeFontSize)
  const [localStackFontSize, setLocalStackFontSize] = useState(storeStackFontSize)
  const [localLineBreakConfig, setLocalLineBreakConfig] = useState(storeLineBreakConfig)
  const [isAndroid, setIsAndroid] = useState(false)

  // Synchronisiere lokale States NUR beim Öffnen der Einstellungen
  useEffect(() => {
    if (isOpen) {
      console.log("🔄 Einstellungen geöffnet - Synchronisiere lokale States mit Store")
      setLocalFontSize(storeFontSize)
      setLocalStackFontSize(storeStackFontSize)
      setLocalLineBreakConfig(storeLineBreakConfig)
    }
  }, [isOpen]) // NUR bei isOpen-Änderung, NICHT bei Store-Updates!

  // Android-Erkennung
  useEffect(() => {
    setIsAndroid(/Android/.test(navigator.userAgent))
  }, [])

  // Wenn Modal nicht geöffnet ist, nichts rendern
  if (!isOpen) return null

  // Handler-Funktionen mit sofortiger lokaler State-Aktualisierung
  const handleFontSizeDecrease = () => {
    const newSize = Math.max(11, localFontSize - 2)
    console.log("🔧 Font Size verringern:", localFontSize, "->", newSize)
    setLocalFontSize(newSize) // Sofort lokalen State aktualisieren
    setFontSize(newSize) // Store aktualisieren
  }

  const handleFontSizeIncrease = () => {
    const newSize = Math.min(64, localFontSize + 2)
    console.log("🔧 Font Size erhöhen:", localFontSize, "->", newSize)
    setLocalFontSize(newSize) // Sofort lokalen State aktualisieren
    setFontSize(newSize) // Store aktualisieren
  }

  const handleStackFontSizeDecrease = () => {
    const newSize = Math.max(11, localStackFontSize - 1)
    console.log("🔧 Stack Font Size verringern:", localStackFontSize, "->", newSize)
    setLocalStackFontSize(newSize) // Sofort lokalen State aktualisieren
    setStackFontSize(newSize) // Store aktualisieren
  }

  const handleStackFontSizeIncrease = () => {
    const newSize = Math.min(64, localStackFontSize + 1)
    console.log("🔧 Stack Font Size erhöhen:", localStackFontSize, "->", newSize)
    setLocalStackFontSize(newSize) // Sofort lokalen State aktualisieren
    setStackFontSize(newSize) // Store aktualisieren
  }

  const handleLineWidthChange = (value: string) => {
    const newWidth = Number.parseInt(value)
    console.log("🔧 Zeilenlänge ändern:", localLineBreakConfig.maxCharsPerLine, "->", newWidth)
    const newConfig = { ...localLineBreakConfig, maxCharsPerLine: newWidth }
    setLocalLineBreakConfig(newConfig) // Sofort lokalen State aktualisieren
    setFixedLineLength(newWidth) // Store aktualisieren
  }

  const handleAutoLineWidthToggle = () => {
    const newAutoMaxChars = !localLineBreakConfig.autoMaxChars
    console.log("🔧 Auto-Zeilenlänge umschalten:", localLineBreakConfig.autoMaxChars, "->", newAutoMaxChars)
    const newConfig = { ...localLineBreakConfig, autoMaxChars: newAutoMaxChars }
    setLocalLineBreakConfig(newConfig) // Sofort lokalen State aktualisieren
    updateLineBreakConfig({ autoMaxChars: newAutoMaxChars }) // Store aktualisieren
  }

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden font-sans"
      style={{
        backgroundColor: darkMode ? "#111827" : "#ffffff",
      }}
    >
      {/* Header */}
      <div
        className={`flex items-center justify-between p-4 border-b ${darkMode ? "border-gray-700" : "border-gray-200"}`}
        style={{
          position: "sticky",
          top: 0,
          backgroundColor: darkMode ? "#111827" : "#ffffff",
          zIndex: 10,
        }}
      >
        {/* Zurück-Button */}
        <button
          className={`flex items-center text-lg font-medium p-3 rounded-full ${
            darkMode ? "hover:bg-gray-800" : "hover:bg-gray-100"
          }`}
          onClick={onClose}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-6 w-6 mr-2"
          >
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          <span>Zurück</span>
        </button>

        {/* Titel */}
        <h1 className="text-xl font-medium">Einstellungen</h1>

        {/* Platzhalter für symmetrisches Layout */}
        <div style={{ width: "48px" }}></div>
      </div>

      {/* Content */}
      <div
        className="p-6 space-y-8 overflow-auto"
        style={{
          height: "calc(100vh - 70px)",
          color: darkMode ? "#f9fafb" : "#111827",
        }}
      >
        {/* Schriftgröße für aktive Zeile */}
        <div className="space-y-4">
          <h2 className="text-xl mb-4 font-serif">Schreibkopf</h2>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
            <label style={{ display: "flex", alignItems: "center", fontSize: "1.125rem" }}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ marginRight: "0.5rem" }}
              >
                <polyline points="4 7 4 4 20 4 20 7"></polyline>
                <line x1="9" y1="20" x2="15" y2="20"></line>
                <line x1="12" y1="4" x2="12" y2="20"></line>
              </svg>
              Schriftgröße
            </label>
            <div style={{ display: "flex", alignItems: "center" }}>
              <button
                onClick={handleFontSizeDecrease}
                style={{
                  height: "3.5rem",
                  width: "3.5rem",
                  borderRadius: "9999px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: `1px solid ${darkMode ? "#4b5563" : "#d1d5db"}`,
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
              </button>
              <span
                style={{
                  margin: "0 1rem",
                  fontFamily: "monospace",
                  width: "3rem",
                  textAlign: "center",
                  fontSize: "1.25rem",
                }}
              >
                {localFontSize}
              </span>
              <button
                onClick={handleFontSizeIncrease}
                style={{
                  height: "3.5rem",
                  width: "3.5rem",
                  borderRadius: "9999px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: `1px solid ${darkMode ? "#4b5563" : "#d1d5db"}`,
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
              </button>
            </div>
          </div>
          <div
            className="font-serif"
            style={{
              padding: "1.25rem",
              borderRadius: "0.5rem",
              backgroundColor: darkMode ? "#1f2937" : "#f3f4f6",
              overflow: "hidden",
              fontSize: `${localFontSize}px`,
            }}
          >
            <span
              style={{
                display: "-webkit-box",
                WebkitLineClamp: 1,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              Beispieltext für Schreibkopf
            </span>
          </div>
        </div>

        {/* Trennlinie */}
        <div
          style={{
            height: "1px",
            width: "100%",
            backgroundColor: darkMode ? "#374151" : "#e5e7eb",
          }}
        ></div>

        {/* Schriftgröße für Zeilenstack */}
        <div className="space-y-4">
          <h2 className="text-xl mb-4 font-serif">Zeilenstack</h2>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
            <label style={{ display: "flex", alignItems: "center", fontSize: "1.125rem" }}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ marginRight: "0.5rem" }}
              >
                <line x1="17" y1="10" x2="3" y2="10"></line>
                <line x1="21" y1="6" x2="3" y2="6"></line>
                <line x1="21" y1="14" x2="3" y2="14"></line>
                <line x1="17" y1="18" x2="3" y2="18"></line>
              </svg>
              Schriftgröße
            </label>
            <div style={{ display: "flex", alignItems: "center" }}>
              <button
                onClick={handleStackFontSizeDecrease}
                style={{
                  height: "3.5rem",
                  width: "3.5rem",
                  borderRadius: "9999px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: `1px solid ${darkMode ? "#4b5563" : "#d1d5db"}`,
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
              </button>
              <span
                style={{
                  margin: "0 1rem",
                  fontFamily: "monospace",
                  width: "3rem",
                  textAlign: "center",
                  fontSize: "1.25rem",
                }}
              >
                {localStackFontSize}
              </span>
              <button
                onClick={handleStackFontSizeIncrease}
                style={{
                  height: "3.5rem",
                  width: "3.5rem",
                  borderRadius: "9999px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: `1px solid ${darkMode ? "#4b5563" : "#d1d5db"}`,
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
              </button>
            </div>
          </div>
          <div
            className="font-serif"
            style={{
              padding: "1.25rem",
              borderRadius: "0.5rem",
              backgroundColor: darkMode ? "#1f2937" : "#f3f4f6",
              overflow: "hidden",
              fontSize: `${localStackFontSize}px`,
            }}
          >
            <span
              style={{
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              Beispieltext für den Zeilenstack. Hier sehen Sie, wie bereits geschriebene Zeilen aussehen werden.
            </span>
          </div>
        </div>

        {/* Trennlinie */}
        <div
          style={{
            height: "1px",
            width: "100%",
            backgroundColor: darkMode ? "#374151" : "#e5e7eb",
          }}
        ></div>

        {/* Zeilenlänge */}
        <div className="space-y-4">
          <h2 className="text-xl mb-4 font-sans">Zeilenlänge</h2>
          <div
            style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}
          >
            <label className="text-lg font-sans">Maximale Zeichen pro Zeile</label>
            <span style={{ fontFamily: "monospace", fontSize: "1.25rem" }}>{localLineBreakConfig.maxCharsPerLine}</span>
          </div>
          <input
            type="range"
            min="20"
            max="100"
            value={localLineBreakConfig.maxCharsPerLine}
            onChange={(e) => handleLineWidthChange(e.target.value)}
            style={{
              width: "100%",
              height: "2rem",
              borderRadius: "0.5rem",
              appearance: "none",
              cursor: "pointer",
              backgroundColor: darkMode ? "#1f2937" : "#e5e7eb",
            }}
          />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: "0.875rem",
              fontFamily: "monospace",
              marginTop: "0.5rem",
            }}
          >
            <span>20</span>
            <span>60</span>
            <span>100</span>
          </div>
        </div>

        {/* Trennlinie */}
        <div
          style={{
            height: "1px",
            width: "100%",
            backgroundColor: darkMode ? "#374151" : "#e5e7eb",
          }}
        ></div>

        {/* Automatische Zeilenlänge */}
        <div style={{ padding: "1rem 0" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <label className="text-lg font-sans">Automatische Zeilenlänge</label>
            <label style={{ position: "relative", display: "inline-flex", alignItems: "center", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={localLineBreakConfig.autoMaxChars}
                onChange={handleAutoLineWidthToggle}
                style={{ position: "absolute", opacity: 0, width: 0, height: 0 }}
              />
              <div
                style={{
                  width: "4rem",
                  height: "2.25rem",
                  borderRadius: "9999px",
                  backgroundColor: localLineBreakConfig.autoMaxChars
                    ? darkMode
                      ? "#4b5563"
                      : "#9ca3af"
                    : darkMode
                      ? "#1f2937"
                      : "#e5e7eb",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: "0.25rem",
                    left: localLineBreakConfig.autoMaxChars ? "2.25rem" : "0.25rem",
                    backgroundColor: "white",
                    border: "1px solid #d1d5db",
                    borderRadius: "9999px",
                    height: "1.75rem",
                    width: "1.75rem",
                    transition: "all 0.3s",
                  }}
                ></div>
              </div>
            </label>
          </div>
          <p
            className="font-sans"
            style={{
              fontSize: "0.875rem",
              marginTop: "0.5rem",
              color: darkMode ? "#9ca3af" : "#6b7280",
            }}
          >
            Passt die Zeilenlänge automatisch an die Bildschirmgröße an
          </p>
        </div>
      </div>
    </div>
  )
}
