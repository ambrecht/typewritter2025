"use client"

import { useTypewriterStore } from "@/store/typewriter-store"

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
  darkMode: boolean
}

export default function SettingsModal({ isOpen, onClose, darkMode }: SettingsModalProps) {
  const {
    fontSize,
    stackFontSize,
    setFontSize,
    setStackFontSize,
    lineBreakConfig,
    updateLineBreakConfig,
    setFixedLineLength,
    flowMode,
    toggleFlowMode,
    // New config
    wrapMode,
    hyphenChar,
    maxUserCols,
    maxAutoCols,
    setWrapMode,
    setHyphenChar,
    setUserMaxCols,
  } = useTypewriterStore()

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden font-sans"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
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
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          <span className="ml-2">Zurück</span>
        </button>
        <h1 id="settings-title" className="text-xl font-medium">
          Einstellungen
        </h1>
        <div style={{ width: "48px" }} />
      </div>

      {/* Content */}
      <div
        className="p-6 space-y-8 overflow-auto"
        style={{
          height: "calc(100svh - 70px)",
          color: darkMode ? "#f9fafb" : "#111827",
        }}
      >
        {/* Active line font size */}
        <div className="space-y-4">
          <h2 className="text-xl mb-4 font-serif">Schreibkopf</h2>
          <div className="flex items-center justify-between mb-4">
            <label className="text-lg flex items-center">
              <span>Schriftgröße</span>
            </label>
            <div className="flex items-center">
              <button
                onClick={() => setFontSize(Math.max(11, fontSize - 2))}
                className="h-14 w-14 rounded-full flex items-center justify-center border"
                style={{ borderColor: darkMode ? "#4b5563" : "#d1d5db" }}
              >
                <span className="sr-only">Kleiner</span>–
              </button>
              <span className="mx-4 font-mono w-12 text-center text-xl">{fontSize}</span>
              <button
                onClick={() => setFontSize(Math.min(64, fontSize + 2))}
                className="h-14 w-14 rounded-full flex items-center justify-center border"
                style={{ borderColor: darkMode ? "#4b5563" : "#d1d5db" }}
              >
                <span className="sr-only">Größer</span>+
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
              fontSize: `${fontSize}px`,
            }}
          >
            <span
              style={{ display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical", overflow: "hidden" }}
            >
              Beispieltext für Schreibkopf
            </span>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, backgroundColor: darkMode ? "#374151" : "#e5e7eb" }} />

        {/* Stack font size */}
        <div className="space-y-4">
          <h2 className="text-xl mb-4 font-serif">Zeilenstack</h2>
          <div className="flex items-center justify-between mb-4">
            <label className="text-lg flex items-center">
              <span>Schriftgröße</span>
            </label>
            <div className="flex items-center">
              <button
                onClick={() => setStackFontSize(Math.max(11, stackFontSize - 1))}
                className="h-14 w-14 rounded-full flex items-center justify-center border"
                style={{ borderColor: darkMode ? "#4b5563" : "#d1d5db" }}
              >
                <span className="sr-only">Kleiner</span>–
              </button>
              <span className="mx-4 font-mono w-12 text-center text-xl">{stackFontSize}</span>
              <button
                onClick={() => setStackFontSize(Math.min(64, stackFontSize + 1))}
                className="h-14 w-14 rounded-full flex items-center justify-center border"
                style={{ borderColor: darkMode ? "#4b5563" : "#d1d5db" }}
              >
                <span className="sr-only">Größer</span>+
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
              fontSize: `${stackFontSize}px`,
            }}
          >
            <span
              style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}
            >
              Beispieltext für den Zeilenstack. Hier sehen Sie, wie bereits geschriebene Zeilen aussehen werden.
            </span>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, backgroundColor: darkMode ? "#374151" : "#e5e7eb" }} />

        {/* New: Wrap Mode & Hyphen */}
        <div className="space-y-3">
          <h2 className="text-xl mb-2 font-sans">Umbruch</h2>
          <div className="flex items-center justify-between">
            <label className="text-lg">Umbruchart</label>
            <select
              value={wrapMode}
              onChange={(e) => setWrapMode(e.target.value as "hard-hyphen" | "word-wrap")}
              className={`px-3 py-2 rounded border ${darkMode ? "bg-gray-800 border-gray-700 text-gray-100" : "bg-white border-gray-300"}`}
            >
              <option value="word-wrap">Word-Wrap</option>
              <option value="hard-hyphen">Hard-Hyphen</option>
            </select>
          </div>
          <div className="flex items-center justify-between">
            <label className="text-lg">Hyphen-Zeichen</label>
            <input
              value={hyphenChar}
              onChange={(e) => setHyphenChar(e.target.value?.slice(0, 2) || "-")}
              className={`px-3 py-2 rounded border w-24 text-center ${darkMode ? "bg-gray-800 border-gray-700 text-gray-100" : "bg-white border-gray-300"}`}
            />
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, backgroundColor: darkMode ? "#374151" : "#e5e7eb" }} />

        {/* New: User Max Cols (clamped to auto) */}
        <div className="space-y-2">
          <h2 className="text-xl mb-2 font-sans">Max. Zeichen pro Zeile</h2>
          <div className="flex items-center justify-between">
            <span className="text-sm opacity-75">Automatische Grenze</span>
            <span className="font-mono">{maxAutoCols}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm opacity-75">Benutzerlimit</span>
            <span className="font-mono">{maxUserCols ?? maxAutoCols}</span>
          </div>
          <input
            type="range"
            min={1}
            max={Math.max(1, maxAutoCols)}
            value={maxUserCols ?? maxAutoCols}
            onChange={(e) => setUserMaxCols(Number.parseInt(e.target.value, 10))}
            className="w-full"
          />
          <p className="text-xs opacity-70">Ihr Limit wird automatisch auf die Auto-Grenze geklemmt.</p>
        </div>

        {/* Divider */}
        <div style={{ height: 1, backgroundColor: darkMode ? "#374151" : "#e5e7eb" }} />

        {/* Legacy settings retained for compatibility */}
        <div className="space-y-4">
          <h2 className="text-xl mb-2 font-sans">Legacy: Zeilenlänge</h2>
          <div className="flex items-center justify-between">
            <label className="text-lg">Maximale Zeichen pro Zeile</label>
            <span className="font-mono text-xl">{lineBreakConfig.maxCharsPerLine}</span>
          </div>
          <input
            type="range"
            min="20"
            max="100"
            value={lineBreakConfig.maxCharsPerLine}
            onChange={(e) => setFixedLineLength(Number.parseInt(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-sm font-mono opacity-70">
            <span>20</span>
            <span>60</span>
            <span>100</span>
          </div>
          <div className="flex items-center justify-between">
            <label className="text-lg">Automatische Zeilenlänge</label>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={lineBreakConfig.autoMaxChars}
                onChange={() => updateLineBreakConfig({ autoMaxChars: !lineBreakConfig.autoMaxChars })}
                className="sr-only"
              />
              <span
                className="w-16 h-9 rounded-full relative"
                style={{
                  backgroundColor: lineBreakConfig.autoMaxChars
                    ? darkMode
                      ? "#4b5563"
                      : "#9ca3af"
                    : darkMode
                      ? "#1f2937"
                      : "#e5e7eb",
                }}
              >
                <span
                  className="absolute top-1 left-1 h-7 w-7 rounded-full bg-white border"
                  style={{
                    transform: lineBreakConfig.autoMaxChars ? "translateX(28px)" : "translateX(0px)",
                    transition: "all .2s",
                    borderColor: "#d1d5db",
                  }}
                />
              </span>
            </label>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, backgroundColor: darkMode ? "#374151" : "#e5e7eb" }} />

        {/* Flow Mode */}
        <div className="space-y-2">
          <h2 className="text-xl mb-2 font-sans">Flow Mode</h2>
          <div className="flex items-center justify-between">
            <span>Aktiv</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={flowMode} onChange={toggleFlowMode} className="sr-only" />
              <span
                className="w-16 h-9 rounded-full relative"
                style={{
                  backgroundColor: flowMode ? (darkMode ? "#4b5563" : "#9ca3af") : darkMode ? "#1f2937" : "#e5e7eb",
                }}
              >
                <span
                  className="absolute top-1 left-1 h-7 w-7 rounded-full bg-white border"
                  style={{
                    transform: flowMode ? "translateX(28px)" : "translateX(0px)",
                    transition: "all .2s",
                    borderColor: "#d1d5db",
                  }}
                />
              </span>
            </label>
          </div>
          <p className="text-xs opacity-70">Wenn aktiviert, kann nicht gelöscht werden.</p>
        </div>
      </div>
    </div>
  )
}
