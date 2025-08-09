"use client"

import type React from "react"
import { useEffect, useState } from "react"

interface ActiveLineProps {
  activeLine: string
  darkMode: boolean
  fontSize: number
  lineHeightPx: number
  showCursor: boolean
  maxCharsPerLine: number
  hiddenInputRef: React.RefObject<HTMLTextAreaElement | null>
  activeLineRef: React.RefObject<HTMLDivElement | null>
  isAndroid?: boolean
}

export function ActiveLine({
  activeLine,
  darkMode,
  fontSize,
  lineHeightPx,
  showCursor,
  maxCharsPerLine,
  hiddenInputRef,
  activeLineRef,
}: ActiveLineProps) {
  const [cursorPosition, setCursorPosition] = useState(activeLine.length)
  const [isFocused, setIsFocused] = useState(true)

  useEffect(() => {
    const updateCursor = () => {
      if (hiddenInputRef.current) {
        const pos = hiddenInputRef.current.selectionStart ?? activeLine.length
        setCursorPosition(pos)
      }
    }
    const onFocus = () => setIsFocused(true)
    const onBlur = () => setIsFocused(false)
    const input = hiddenInputRef.current
    if (input) {
      input.addEventListener("focus", onFocus)
      input.addEventListener("blur", onBlur)
      input.addEventListener("select", updateCursor)
      input.addEventListener("keyup", updateCursor)
      input.addEventListener("click", updateCursor)
      input.addEventListener("input", updateCursor)
    }
    return () => {
      if (input) {
        input.removeEventListener("focus", onFocus)
        input.removeEventListener("blur", onBlur)
        input.removeEventListener("select", updateCursor)
        input.removeEventListener("keyup", updateCursor)
        input.removeEventListener("click", updateCursor)
        input.removeEventListener("input", updateCursor)
      }
    }
  }, [activeLine, hiddenInputRef])

  return (
    <div
      ref={activeLineRef}
      className={`font-serif relative ${darkMode ? "bg-gray-800" : "bg-[#f3efe9]"}`}
      onClick={() => hiddenInputRef.current?.focus()}
      style={{
        height: `${lineHeightPx}px`,
        lineHeight: `${lineHeightPx}px`,
        padding: "0 1.25rem",
        overflow: "hidden",
      }}
      data-testid="active-line"
    >
      <div className="relative pl-3 h-full">
        <div
          className={`${darkMode ? "text-[#E0E0E0]" : "text-[#222]"}`}
          style={{
            fontSize: `${fontSize}px`,
            lineHeight: `${lineHeightPx}px`,
            whiteSpace: "nowrap",
          }}
          aria-hidden="true"
        >
          {activeLine.slice(0, cursorPosition)}
          <span
            className={`inline-block align-middle ${
              showCursor && isFocused
                ? darkMode
                  ? "border-r-2 border-gray-200"
                  : "border-r-2 border-[#222]"
                : "border-r-2 border-transparent"
            }`}
            style={{
              height: `${Math.round(lineHeightPx * 0.85)}px`,
              marginLeft: "1px",
              transform: "translateY(-0.1em)",
              animation: showCursor && isFocused ? "pulse 1.5s infinite" : "none",
            }}
          />
          {activeLine.slice(cursorPosition)}
        </div>

        <textarea
          ref={hiddenInputRef}
          id="hidden-input"
          value={activeLine}
          readOnly
          className="absolute inset-0 w-full h-full bg-transparent text-transparent caret-transparent outline-none resize-none overflow-hidden z-10"
          style={{
            fontSize: `${fontSize}px`,
            lineHeight: `${lineHeightPx}px`,
            fontFamily: "inherit",
          }}
          rows={1}
          aria-label="Typewriter input area"
        />
      </div>

      <div
        className="absolute bottom-1 right-4 text-[10px] opacity-60 font-mono"
        style={{ lineHeight: "1" }}
        aria-hidden="true"
      >
        {activeLine.length}/{maxCharsPerLine}
      </div>
    </div>
  )
}
