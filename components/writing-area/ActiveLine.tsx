"use client"

import { useEffect } from "react"

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
  isAndroid?: boolean
  isFullscreen?: boolean
  activeLineRef?: React.RefObject<HTMLDivElement | null>
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
  useAutoResizeTextarea(hiddenInputRef, activeLine)

  const fixedActiveLineClass = `flex-shrink-0 font-serif border-t z-10 active-line relative ${
    darkMode
      ? "bg-gray-800 border-gray-700 shadow-[0_-8px_16px_rgba(0,0,0,0.3)]"
      : "bg-[#f3efe9] border-[#e0dcd3] shadow-[0_-8px_16px_rgba(0,0,0,0.1)]"
  }`

  return (
    <div
      ref={activeLineRef}
      className={fixedActiveLineClass}
      style={{
        minHeight: `${fontSize * 1.5 + 24}px`,
        padding: "12px 1.25rem",
        height: "auto",
      }}
      data-testid="active-line"
    >
      <div className="relative w-full h-full flex items-center">
        {/* Die unsichtbare Textarea empfängt den Fokus, um die mobile Tastatur auszulösen.
            `readOnly` verhindert direkte Eingabe und Cursor-Bewegung.
            Die Eingabe wird global über den Keydown-Listener in page.tsx gehandhabt. */}
        <textarea
          ref={hiddenInputRef}
          id="hidden-input" // WICHTIG: ID hinzugefügt
          value={activeLine}
          readOnly
          className="absolute inset-0 w-full h-full bg-transparent text-transparent caret-transparent outline-none resize-none overflow-hidden z-10"
          style={{
            fontSize: `${fontSize}px`,
            lineHeight: "1.5",
            fontFamily: "inherit",
          }}
          rows={1}
          aria-label="Typewriter input area"
        />
        {/* Das sichtbare Div, das den Text und den Cursor anzeigt. */}
        <div
          className={`whitespace-pre-wrap break-words w-full pointer-events-none ${
            darkMode ? "text-gray-200" : "text-gray-800"
          }`}
          style={{
            fontSize: `${fontSize}px`,
            lineHeight: "1.5",
            minHeight: `${fontSize * 1.5}px`,
          }}
          aria-hidden="true"
        >
          {activeLine}
          {showCursor && (
            <span
              className={`inline-block w-0.5 ml-px align-text-bottom animate-pulse ${
                darkMode ? "bg-gray-200" : "bg-gray-900"
              }`}
              style={{ height: `${fontSize * 1.2}px` }}
            />
          )}
          {activeLine.length === 0 && <>&nbsp;</>}
        </div>
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
