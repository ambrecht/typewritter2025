"use client"

import type React from "react"
import { useRef } from "react"
import type { LineBreakConfig } from "@/types"

import { useVisibleLines } from "../hooks/useVisibleLines"
import { CopyButton } from "./writing-area/CopyButton"
import { NavigationHint } from "./writing-area/NavigationHint"
import { LineStack } from "./writing-area/LineStack"
import { ActiveLine } from "./writing-area/ActiveLine"

/**
 * @interface WritingAreaProps
 * @description Props für die WritingArea Komponente.
 * Die Props für `setActiveLine`, `addLineToStack` und `hiddenInputRef` wurden entfernt,
 * da die Eingabelogik nun global gehandhabt wird.
 */
interface WritingAreaProps {
  lines: string[]
  activeLine: string
  maxCharsPerLine: number
  fontSize: number
  stackFontSize: number
  hiddenInputRef: React.RefObject<HTMLTextAreaElement | null> // Add prop back
  showCursor: boolean
  lineBreakConfig: LineBreakConfig
  darkMode: boolean
  mode: "typing" | "navigating"
  selectedLineIndex: number | null
  isFullscreen: boolean
  linesContainerRef?: React.RefObject<HTMLDivElement>
}

/**
 * @component WritingArea
 * @description Die Hauptkomponente des Schreibbereichs.
 * Diese Komponente ist jetzt rein präsentationell und empfängt den darzustellenden Zustand.
 * Die Eingabelogik wurde in die `app/page.tsx` und den Store verlagert.
 */
export default function WritingArea({
  lines,
  activeLine,
  maxCharsPerLine,
  fontSize,
  stackFontSize,
  hiddenInputRef, // Add prop back
  showCursor,
  lineBreakConfig,
  darkMode,
  mode,
  selectedLineIndex,
  isFullscreen,
  linesContainerRef: externalLinesContainerRef,
}: WritingAreaProps) {
  const internalLinesContainerRef = useRef<HTMLDivElement>(null)
  const linesContainerRef = externalLinesContainerRef || internalLinesContainerRef

  const visibleLines = useVisibleLines(lines, 200, mode, selectedLineIndex, isFullscreen)

  return (
    <div className="flex-1 flex flex-col relative overflow-hidden font-serif">
      <CopyButton lines={lines} activeLine={activeLine} darkMode={darkMode} />
      <NavigationHint darkMode={darkMode} />

      <div
        ref={linesContainerRef}
        className={`flex-1 px-4 md:px-6 pt-6 writing-container flex flex-col justify-end ${
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
          visibleLines={visibleLines.map((line, index) => ({ line, index: lines.indexOf(line) }))}
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
          hiddenInputRef={hiddenInputRef} // Pass the ref
          isAndroid={typeof navigator !== "undefined" && navigator.userAgent.includes("Android")}
          isFullscreen={isFullscreen}
        />
      )}
    </div>
  )
}
