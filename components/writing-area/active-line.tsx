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
  /** Progress 0..1 for the thin bar above the ACL */
  progress?: number
}

/**
 * Active Compose Line:
 * - Exactly one line tall; rounded beige pill to match the screenshot.
 * - Thin amber progress bar positioned just above (absolute, no layout shift).
 * - Small amber dot left to the text for accent.
 */
export function ActiveLine({
  activeLine,
  darkMode,
  fontSize,
  lineHeightPx,
  showCursor,
  maxCharsPerLine,
  hiddenInputRef,
  activeLineRef,
  progress = 0,
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

  const pct = Math.max(0, Math.min(1, progress)) * 100

  return (
    <div className="relative">
      {/* Progress line, sits just above the pill (no layout shift) */}
      <div
        aria-hidden="true"
        className="absolute left-0 right-0"
        style={{ top: "-6px", height: "6px", pointerEvents: "none" }}
      >
        <div className={darkMode ? "bg-neutral-800 h-1.5 w-full" : "bg-neutral-200 h-1.5 w-full"}>
          <div
            className={darkMode ? "bg-amber-400 h-full" : "bg-amber-500 h-full"}
            style={{
              width: `${pct}%`,
              transition: "width 200ms ease-out",
              boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.08), 0 0 12px rgba(251,191,36,0.35)",
            }}
          />
        </div>
      </div>

      <div
        ref={activeLineRef}
        id="active-line"
        className={`font-serif relative z-10 border ${
          darkMode ? "border-neutral-800 bg-neutral-900" : "border-[#e8e2d9] bg-[#f5efe6]"
        } rounded-xl`}
        onClick={() => hiddenInputRef.current?.focus()}
        style={{
          height: `${lineHeightPx}px`,
          lineHeight: `${lineHeightPx}px`,
          padding: "0 1.25rem",
          overflow: "hidden",
          boxShadow: darkMode
            ? "0 -4px 14px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.03)"
            : "0 -10px 22px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.35)",
        }}
        data-testid="active-line"
      >
        <div className="relative pl-3 h-full">
          {/* Amber dot */}
          <span
            className={`absolute left-2 top-1/2 -translate-y-1/2 inline-block h-2.5 w-2.5 rounded-full ${
              darkMode ? "bg-amber-400" : "bg-amber-500"
            }`}
            aria-hidden="true"
          />

          {/* Visible text + caret */}
          <div
            className={`${darkMode ? "text-[#E0E0E0]" : "text-[#222]"}`}
            style={{ fontSize: `${fontSize}px`, lineHeight: `${lineHeightPx}px`, whiteSpace: "nowrap" }}
            aria-hidden="true"
          >
            {/* left padding for dot */}
            <span className="inline-block" style={{ width: "16px" }} />
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

          {/* Hidden textarea for focus/IME; readOnly since store handles input */}
          <textarea
            ref={hiddenInputRef}
            id="hidden-input"
            value={activeLine}
            readOnly
            className="absolute inset-0 w-full h-full bg-transparent text-transparent caret-transparent outline-none resize-none overflow-hidden z-10"
            style={{ fontSize: `${fontSize}px`, lineHeight: `${lineHeightPx}px`, fontFamily: "inherit" }}
            rows={1}
            aria-label="Typewriter input area"
          />
        </div>

        {/* Small HUD (optional) */}
        <div
          className="absolute bottom-1 right-4 text-[10px] opacity-65 font-mono"
          style={{ lineHeight: "1" }}
          aria-hidden="true"
        >
          {activeLine.length}/{maxCharsPerLine}
        </div>
      </div>
    </div>
  )
}
