"use client"

import type React from "react"
import { useEffect, useRef } from "react"

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
 * Hook zur automatischen Größenanpassung einer Textarea an ihren Inhalt.
 */
function useAutoResizeTextarea(ref: React.RefObject<HTMLTextAreaElement>, value: string) {
  useEffect(() => {
    const textarea = ref.current
    if (textarea) {
      textarea.style.height = "auto"
      const scrollHeight = textarea.scrollHeight
      textarea.style.height = `${scrollHeight}px`
    }
  }, [ref, value])
}

/**
 * Komponente für die aktive Eingabezeile.
 * Wächst automatisch mit dem Inhalt, um Scrollbalken zu vermeiden.
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

  useAutoResizeTextarea(hiddenInputRef, activeLine)

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
        minHeight: `${fontSize * 1.5 + 24}px`,
        padding: "12px 1.25rem",
        height: "auto",
      }}
      data-testid="active-line"
    >
      <div className="relative w-full h-full flex items-center">
        <textarea
          ref={hiddenInputRef}
          value={activeLine}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          className="absolute inset-0 w-full h-full bg-transparent text-transparent caret-white outline-none resize-none overflow-hidden text-[17px] leading-8 sm:text-lg"
          style={{
            fontSize: `${fontSize}px`,
            lineHeight: "1.5",
            fontFamily: "inherit",
            zIndex: 2,
          }}
          rows={1}
          autoFocus
          aria-label="Typewriter input field"
        />
        <div
          ref={visibleTextRef}
          className={`whitespace-pre-wrap break-words w-full pointer-events-none text-[17px] leading-8 sm:text-lg ${
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
