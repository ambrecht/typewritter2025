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

/**
 * @interface WritingAreaProps
 * @description Props für die WritingArea Komponente.
 */
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
 * Orchestriert die Darstellung des Zeilenstapels (`LineStack`) und der aktiven Eingabezeile (`ActiveLine`).
 *
 * @param {WritingAreaProps} props - Die Props für die Komponente.
 * @returns {React.ReactElement} Das gerenderte Schreibbereichs-Element.
 */
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
  lineBreakConfig,
  darkMode,
  mode,
  selectedLineIndex,
  isFullscreen,
  linesContainerRef: externalLinesContainerRef,
}: WritingAreaProps) {
  // Internes Ref, falls von außen keines übergeben wird.
  const internalLinesContainerRef = useRef<HTMLDivElement>(null)
  const linesContainerRef = externalLinesContainerRef || internalLinesContainerRef

  // Hook für die Verarbeitung von Tastatureingaben.
  const { handleChange, handleKeyDown } = useKeyboardHandling({
    setActiveLine,
    addLineToStack,
    lineBreakConfig,
    hiddenInputRef,
    linesContainerRef,
  })

  // Hook zur Virtualisierung und Berechnung der sichtbaren Zeilen.
  // Zeigt nur eine Teilmenge der Zeilen an, um die Performance bei sehr langen Texten zu verbessern.
  const visibleLines = useVisibleLines(lines, 200, mode, selectedLineIndex, isFullscreen)

  return (
    <div className="flex-1 flex flex-col relative overflow-hidden font-serif">
      {/* Hilfs-UI-Elemente, die über dem Schreibbereich schweben */}
      <CopyButton lines={lines} activeLine={activeLine} darkMode={darkMode} />
      <NavigationHint darkMode={darkMode} />

      {/* Container für den Zeilenstack */}
      <div
        ref={linesContainerRef}
        className={`flex-1 px-4 md:px-6 pt-6 writing-container flex flex-col justify-end ${
          darkMode ? "bg-gray-900 text-gray-200" : "bg-[#fcfcfa] text-gray-800"
        }`}
        style={{
          fontSize: `${stackFontSize}px`,
          lineHeight: isFullscreen ? "1.3" : "1.4",
          overflow: "hidden", // Verhindert Scrollbalken, da Scrollen programmatisch gehandhabt wird
        }}
        aria-live="polite" // Wichtig für Screenreader, um Änderungen mitzuteilen
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

      {/* Aktive Eingabezeile, wird nur im Schreibmodus angezeigt */}
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
