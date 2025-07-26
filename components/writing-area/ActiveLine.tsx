"use client"

import type React from "react"
import { useEffect, useRef } from "react"

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
  handleChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  handleKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
  isAndroid?: boolean
  isFullscreen?: boolean
}

/**
 * @hook useAutoResizeTextarea
 * @description Ein Custom Hook, der die Höhe einer Textarea automatisch an ihren Inhalt anpasst.
 * Verhindert das Erscheinen von Scrollbalken innerhalb der Textarea.
 *
 * @param {React.RefObject<HTMLTextAreaElement>} ref - Das Ref zur Textarea.
 * @param {string} value - Der aktuelle Wert der Textarea, bei dessen Änderung die Höhe neu berechnet wird.
 */
function useAutoResizeTextarea(ref: React.RefObject<HTMLTextAreaElement>, value: string) {
  useEffect(() => {
    const textarea = ref.current
    if (textarea) {
      // Setze die Höhe kurz auf 'auto', damit der Browser die benötigte scrollHeight neu berechnen kann.
      textarea.style.height = "auto"
      const scrollHeight = textarea.scrollHeight
      // Setze die Höhe auf die berechnete scrollHeight.
      textarea.style.height = `${scrollHeight}px`
    }
  }, [ref, value])
}

/**
 * @component ActiveLine
 * @description Stellt die untere, aktive Eingabezeile dar.
 * Nutzt eine unsichtbare `<textarea>` für die tatsächliche Eingabe und ein `<div>` zur visuellen Darstellung des Textes.
 * Dies ermöglicht volle Kontrolle über das Aussehen, während die native Eingabefunktionalität erhalten bleibt.
 *
 * @param {ActiveLineProps} props - Die Props für die Komponente.
 * @returns {React.ReactElement} Das gerenderte Element der aktiven Zeile.
 */
export function ActiveLine({
  activeLine,
  darkMode,
  fontSize,
  showCursor,
  maxCharsPerLine,
  hiddenInputRef,
  handleChange,
  handleKeyDown,
}: ActiveLineProps) {
  const visibleTextRef = useRef<HTMLDivElement>(null)

  // Hook zur automatischen Höhenanpassung der unsichtbaren Textarea.
  useAutoResizeTextarea(hiddenInputRef, activeLine)

  // Synchronisiere die Höhe des sichtbaren Divs mit der Höhe der unsichtbaren Textarea.
  useEffect(() => {
    if (hiddenInputRef.current && visibleTextRef.current) {
      visibleTextRef.current.style.height = hiddenInputRef.current.style.height
    }
  }, [activeLine, hiddenInputRef])

  const fixedActiveLineClass = `flex-shrink-0 font-serif border-t z-10 active-line relative ${
    darkMode
      ? "bg-gray-800 border-gray-700 shadow-[0_-8px_16px_rgba(0,0,0,0.3)]"
      : "bg-[#f3efe9] border-[#e0dcd3] shadow-[0_-8px_16px_rgba(0,0,0,0.1)]"
  }`

  return (
    <div
      className={fixedActiveLineClass}
      style={{
        minHeight: `${fontSize * 1.5 + 24}px`, // Mindesthöhe basierend auf Schriftgröße
        padding: "12px 1.25rem",
        height: "auto", // Höhe passt sich dem Inhalt an
      }}
      data-testid="active-line"
    >
      <div className="relative w-full h-full flex items-center">
        {/* Die unsichtbare Textarea, die die tatsächlichen Benutzereingaben empfängt. */}
        <textarea
          ref={hiddenInputRef}
          value={activeLine}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          className="absolute inset-0 w-full h-full bg-transparent text-transparent caret-white outline-none resize-none overflow-hidden"
          style={{
            fontSize: `${fontSize}px`,
            lineHeight: "1.5",
            fontFamily: "inherit", // Erbt die Serifenschrift
            zIndex: 2, // Liegt über dem sichtbaren Text, um Klicks zu empfangen
          }}
          rows={1}
          autoFocus
          aria-label="Typewriter input field"
        />
        {/* Das sichtbare Div, das den Text und den Cursor anzeigt. */}
        <div
          ref={visibleTextRef}
          className={`whitespace-pre-wrap break-words w-full pointer-events-none ${
            darkMode ? "text-gray-200" : "text-gray-800"
          }`}
          style={{
            fontSize: `${fontSize}px`,
            lineHeight: "1.5",
            minHeight: `${fontSize * 1.5}px`,
          }}
          aria-hidden="true" // Für Screenreader ausblenden, da die Textarea die zugängliche Quelle ist.
        >
          {activeLine}
          {/* Der blinkende Cursor */}
          {showCursor && (
            <span
              className={`inline-block w-0.5 ml-px align-text-bottom animate-pulse ${
                darkMode ? "bg-gray-200" : "bg-gray-900"
              }`}
              style={{ height: `${fontSize * 1.2}px` }}
            />
          )}
          {/* Ein Non-breaking Space, um sicherzustellen, dass die Zeile auch bei Leerheit Höhe hat. */}
          {activeLine.length === 0 && <>&nbsp;</>}
        </div>
      </div>
      {/* Fortschrittsbalken, der die aktuelle Zeilenlänge anzeigt. */}
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
      {/* Anzeige der Zeichenzahl */}
      <div className="absolute bottom-2 right-4 text-xs opacity-60 font-mono">
        {activeLine.length}/{maxCharsPerLine}
      </div>
    </div>
  )
}
