"use client"

import type React from "react"
import { useRef } from "react"
import type { LineBreakConfig } from "@/types"

import { useKeyboardHandling } from "../hooks/useKeyboardHandling"
import { useVisibleLines } from "../hooks/useVisibleLines"
import { CopyButton } from "./writing-area/CopyButton"
import { NavigationHint } from "./writing-area/NavigationHint"
import { LineStack } from "./writing-area/LineStack"
import { ActiveLine } from "./writing-area/ActiveLine"

const DEFAULT_LINE_BREAK_CONFIG: LineBreakConfig = {
  maxCharsPerLine: 56,
  autoMaxChars: true,
}

interface WritingAreaProps {
  lines: string[]
  activeLine: string
  setActiveLine: (line: string) => void
  addLineToStack: () => void
  maxCharsPerLine: number
  fontSize: number
  stackFontSize: number
  hiddenInputRef: React.RefObject<HTMLTextAreaElement | null>
  showCursor: boolean
  lineBreakConfig?: LineBreakConfig
  darkMode: boolean
  mode: "typing" | "navigating"
  selectedLineIndex: number | null
  isFullscreen: boolean
  linesContainerRef?: React.RefObject<HTMLDivElement>
}

export default function WritingArea({
  lines,
  activeLine,
  setActiveLine,
  addLineToStack,
  maxCharsPerLine,
  fontSize,
  stackFontSize,
  hiddenInputRef,
  showCursor,
  lineBreakConfig = DEFAULT_LINE_BREAK_CONFIG,
  darkMode,
  mode,
  selectedLineIndex,
  isFullscreen,
  linesContainerRef: externalLinesContainerRef,
}: WritingAreaProps) {
  const internalLinesContainerRef = useRef<HTMLDivElement>(null)
  const linesContainerRef = externalLinesContainerRef || internalLinesContainerRef

  const { handleChange, handleKeyDown } = useKeyboardHandling({
    setActiveLine,
    addLineToStack,
    lineBreakConfig,
    hiddenInputRef,
    linesContainerRef,
  })

  const visibleLines = useVisibleLines(lines, 200, mode, selectedLineIndex, isFullscreen)

  return (
    <div className="flex-1 flex flex-col relative overflow-hidden">
      <CopyButton lines={lines} activeLine={activeLine} darkMode={darkMode} />
      <NavigationHint darkMode={darkMode} />
      <div
        ref={linesContainerRef}
        className={`flex-1 px-6 pt-6 writing-container flex flex-col justify-end ${
          darkMode ? "bg-gray-900 text-gray-200" : "bg-[#fcfcfa] text-gray-800"
        }`}
        style={{
          fontSize: `${stackFontSize}px`,
          lineHeight: isFullscreen ? "1.3" : "1.4",
          overflow: "hidden",
        }}
        aria-live="polite"
      >
        <LineStack
          visibleLines={visibleLines.map((line, index) => ({ line, index }))}
          darkMode={darkMode}
          stackFontSize={stackFontSize}
          mode={mode}
          selectedLineIndex={selectedLineIndex}
          isFullscreen={isFullscreen}
        />
      </div>
      {mode === "typing" && (
        <ActiveLine
          activeLine={activeLine}
          darkMode={darkMode}
          fontSize={fontSize}
          showCursor={showCursor}
          maxCharsPerLine={maxCharsPerLine}
          hiddenInputRef={hiddenInputRef}
          handleChange={handleChange}
          handleKeyDown={handleKeyDown}
          isAndroid={typeof navigator !== "undefined" && navigator.userAgent.includes("Android")}
          isFullscreen={isFullscreen}
        />
      )}
    </div>
  )
}
