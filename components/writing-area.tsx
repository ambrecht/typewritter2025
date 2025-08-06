"use client"

import type React from "react"
import { useEffect, useState, useRef } from "react"
import type { LineBreakConfig, ParagraphRange, FormattedLine } from "@/types"

import { useVisibleLines } from "@/hooks/useVisibleLines"
import { useContainerDimensions } from "@/hooks/useContainerDimensions"
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
  lines: Line[]
  activeLine: string
  setActiveLine: (line: string) => void
  addLineToStack: () => void
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
  maxVisibleLines: number
  activeLineRef?: React.RefObject<HTMLDivElement>
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
  setActiveLine,
  addLineToStack,
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
  maxVisibleLines,
  activeLineRef,
}: WritingAreaProps) {
  const { linesContainerRef, activeLineRef, maxVisibleLines } = useContainerDimensions(stackFontSize)

  useEffect(() => {
    if (externalLinesContainerRef) {
      externalLinesContainerRef.current = linesContainerRef.current
    }

    // Reduziere auf eine verzögerte Operation
    const timeoutId = setTimeout(scrollToBottom, 150)
    return () => clearTimeout(timeoutId)
  }, [lines.length, mode])

  // Berechne die Höhe des aktiven Zeilenbereichs
  // Reduziere die Höhe für Android und im Vollbildmodus
  const activeLineHeight =
    isFullscreen || (typeof navigator !== "undefined" && navigator.userAgent.includes("Android"))
      ? fontSize * 1.8 + 16 // Stark reduzierte Höhe für Vollbildmodus und Android
      : fontSize * 2.0 + 24 // Reduzierte Standard-Höhe

  // Ersetze durch einfache CSS-Klassen-Umschaltung:
  useEffect(() => {
    if (linesContainerRef.current) {
      linesContainerRef.current.classList.toggle("fullscreen-mode", isFullscreen)
    }
  }, [isFullscreen])

  // Prüfe, ob es sich um ein Android-Gerät handelt
  const isAndroid = typeof navigator !== "undefined" && navigator.userAgent.includes("Android")

  return (
    <div className="flex-1 flex flex-col relative overflow-x-hidden overflow-y-auto font-serif">
      <CopyButton lines={lines} activeLine={activeLine} darkMode={darkMode} />
      <NavigationHint darkMode={darkMode} />

      <div
        ref={linesContainerRef}
        className={`flex-1 px-4 md:px-6 pt-6 writing-container flex flex-col justify-start ${
          darkMode ? "bg-gray-900 text-gray-200" : "bg-[#fcfcfa] text-gray-800"
        }`}
        style={{
          fontSize: `${stackFontSize}px`,
          lineHeight: isFullscreen ? "1.3" : "1.4",
          overflowY: "auto",
          overflowX: "hidden",
        }}
        aria-live="polite"
      >
        <LineStack
          visibleLines={visibleLines}
          darkMode={darkMode}
          stackFontSize={stackFontSize}
          mode={mode}
          selectedLineIndex={selectedLineIndex}
          isFullscreen={isFullscreen}
          linesContainerRef={linesContainerRef}
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
          activeLineRef={activeLineRef}
          isAndroid={typeof navigator !== "undefined" && navigator.userAgent.includes("Android")}
          isFullscreen={isFullscreen}
          activeLineRef={activeLineRef}
        />
      )}
    </div>
  )
}
