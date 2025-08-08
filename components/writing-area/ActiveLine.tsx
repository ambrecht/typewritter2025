"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { getActiveLineTextClass } from "../../utils/lineClassUtils"

/**
 * @interface ActiveLineProps
 * @description Props für die ActiveLine Komponente.
 */
interface ActiveLineProps {
  activeLine: string
  darkMode: boolean
  fontSize: number
  showCursor: boolean
  maxCharsPerLine: number
  hiddenInputRef: React.RefObject<HTMLTextAreaElement | null>
  activeLineRef: React.RefObject<HTMLDivElement | null>
  isAndroid?: boolean
  isFullscreen?: boolean
}

/**
 * @hook useAutoResizeTextarea
 * @description Ein Custom Hook, der die Höhe einer Textarea automatisch an ihren Inhalt anpasst.
 */
function useAutoResizeTextarea(ref: React.RefObject<HTMLTextAreaElement>, value: string) {
  useEffect(() => {
    const textarea = ref.current
    if (textarea) {
      textarea.style.height = "auto"
      textarea.style.height = `${textarea.scrollHeight}px`
    }
  }, [ref, value])
}

/**
 * @component ActiveLine
 * @description Stellt die untere, aktive Eingabezeile dar.
 * Nutzt eine unsichtbare, schreibgeschützte `<textarea>` für die Fokussierung und Tastaturereignisse
 * und ein `<div>` zur visuellen Darstellung des Textes.
 */
export function ActiveLine({
  activeLine,
  darkMode,
  fontSize,
  showCursor,
  maxCharsPerLine,
  hiddenInputRef,
  activeLineRef,
}: ActiveLineProps) {

  const fixedActiveLineClass = `flex-shrink-0 sticky bottom-0 font-serif z-10 active-line relative ${
    darkMode
      ? "bg-gray-800 shadow-[0_-8px_16px_rgba(0,0,0,0.3)]"
      : "bg-[#f3efe9] shadow-[0_-8px_16px_rgba(0,0,0,0.2)]"
  }`

  const activeLineTextClass = getActiveLineTextClass(darkMode)

  const [cursorPosition, setCursorPosition] = useState(activeLine.length)
  const [isFocused, setIsFocused] = useState(true)

  useEffect(() => {
    const updateCursor = () => {
      if (hiddenInputRef.current) {
        const pos = hiddenInputRef.current.selectionStart ?? activeLine.length
        setCursorPosition(pos)
      }
    }

    const handleFocus = () => setIsFocused(true)
    const handleBlur = () => setIsFocused(false)

    const input = hiddenInputRef.current
    if (input) {
      input.addEventListener("focus", handleFocus)
      input.addEventListener("blur", handleBlur)
      input.addEventListener("select", updateCursor)
      input.addEventListener("keyup", updateCursor)
      input.addEventListener("click", updateCursor)
      input.addEventListener("input", updateCursor)
    }

    return () => {
      if (input) {
        input.removeEventListener("focus", handleFocus)
        input.removeEventListener("blur", handleBlur)
        input.removeEventListener("select", updateCursor)
        input.removeEventListener("keyup", updateCursor)
        input.removeEventListener("click", updateCursor)
        input.removeEventListener("input", updateCursor)
      }
    }
  }, [activeLine])

  // Ändere die return-Anweisung, um die Schreibkopfzeile besser hervorzuheben
  return (
    <div
      ref={activeLineRef}
      className={fixedActiveLineClass}
      onClick={() => hiddenInputRef.current?.focus()}
      style={{
        fontSize: `${fontSize}px`,
        lineHeight: "var(--lineHpx)",
        padding: "0 1.25rem",
      }}
      data-testid="active-line"
    >
      {/* Füge einen visuellen Indikator für die Schreibzeile hinzu */}
      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 flex items-center">
        <div className={`h-3 w-3 rounded-full ${darkMode ? "bg-blue-500" : "bg-amber-500"} opacity-70`}></div>
      </div>

      <div className="relative pl-3">
        {/* Visible text with cursor */}
        <div
          className={activeLineTextClass}
          style={{ fontSize: `${fontSize}px`, lineHeight: "var(--lineHpx)" }}
          aria-hidden="true"
        >
          {activeLine.slice(0, cursorPosition)}
          <span
            className={`inline-block h-[1.2em] ml-[1px] align-middle ${
              showCursor && isFocused
                ? darkMode
                  ? "border-r-2 border-gray-200"
                  : "border-r-2 border-[#222]"
                : "border-r-2 border-transparent"
            }`}
            style={{
              transform: "translateY(-0.1em)",
              animation: showCursor && isFocused ? "pulse 1.5s infinite" : "none",
            }}
          />
          {activeLine.slice(cursorPosition)}
        </div>

        {/* Textarea statt Input für Mehrzeilenunterstützung */}
        <textarea
          ref={hiddenInputRef}
          id="hidden-input" // WICHTIG: ID hinzugefügt
          value={activeLine}
          readOnly
          className="absolute inset-0 w-full h-full bg-transparent text-transparent caret-transparent outline-none resize-none overflow-hidden z-10"
          style={{
            fontSize: `${fontSize}px`,
            lineHeight: "var(--lineHpx)",
            fontFamily: "inherit",
          }}
          rows={1}
          aria-label="Typewriter input area"
        />

      </div>
      {/* Fortschrittsbalken und Zeichenzähler */}
      <div className={`absolute bottom-0 left-0 h-1 ${darkMode ? "bg-gray-700" : "bg-[#e2dfda]"} w-full`}>
        <div
          className={`h-full ${
            activeLine.length > maxCharsPerLine
              ? "bg-red-500"
              : activeLine.length > maxCharsPerLine * 0.8
                ? "bg-amber-500"
                : "bg-green-500"
          } transition-all duration-150`}
          style={{
            width: `${Math.min((activeLine.length / maxCharsPerLine) * 100, 100)}%`,
          }}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={maxCharsPerLine}
          aria-valuenow={activeLine.length}
        />
      </div>
      <div className="absolute bottom-2 right-4 text-xs opacity-60 font-mono">
        {activeLine.length}/{maxCharsPerLine}
      </div>

    </div>
  )
}
