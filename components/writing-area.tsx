"use client"

import type React from "react"
import { useEffect } from "react"
import type { Line } from "@/types"

import { useVisibleLines } from "@/hooks/useVisibleLines"
import { useContainerDimensions } from "@/hooks/useContainerDimensions"
import { CopyButton } from "./writing-area/CopyButton"
import { NavigationHint } from "./writing-area/NavigationHint"
import { LineStack } from "./writing-area/LineStack"

/**
 * @interface WritingAreaProps
 * @description Props für die WritingArea Komponente.
 * Die Props für `setActiveLine`, `addLineToStack` und `hiddenInputRef` wurden entfernt,
 * da die Eingabelogik nun global gehandhabt wird.
 */
interface WritingAreaProps {
  lines: Line[]
  activeLine: string
  stackFontSize: number
  darkMode: boolean
  navMode: boolean
  offset: number
  isFullscreen: boolean
  linesContainerRef?: React.RefObject<HTMLDivElement | null>
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
  stackFontSize,
  darkMode,
  navMode,
  offset,
  isFullscreen,
  linesContainerRef: externalLinesContainerRef,
}: WritingAreaProps) {
  // Verwende Hooks für Container-Dimensionen
  const { linesContainerRef: internalLinesContainerRef, maxVisibleLines } =
    useContainerDimensions(stackFontSize)

  // Verwende den externen Ref, wenn vorhanden, sonst den internen
  const linesContainerRef = externalLinesContainerRef || internalLinesContainerRef

  // Berechne die sichtbaren Zeilen
  const visibleLines = useVisibleLines(
    lines,
    maxVisibleLines,
    offset,
    isFullscreen,
  )

  useEffect(() => {
    if (externalLinesContainerRef) {
      externalLinesContainerRef.current = linesContainerRef.current
    }

    const timeoutId = setTimeout(() => {
      if (linesContainerRef.current) {
        linesContainerRef.current.scrollTop =
          linesContainerRef.current.scrollHeight
      }
    }, 150)

    return () => clearTimeout(timeoutId)
  }, [lines.length, externalLinesContainerRef, linesContainerRef])

  useEffect(() => {
    if (linesContainerRef.current) {
      linesContainerRef.current.classList.toggle("fullscreen-mode", isFullscreen)
    }
  }, [isFullscreen, linesContainerRef])

  return (
    <div className="flex-1 flex flex-col relative overflow-hidden font-serif">
      <CopyButton lines={lines} activeLine={activeLine} darkMode={darkMode} />
      <NavigationHint darkMode={darkMode} />

      <div
        ref={linesContainerRef}
        className={`flex-1 overflow-hidden overflow-x-hidden px-4 md:px-6 pt-6 writing-container flex flex-col justify-start ${
          darkMode ? "bg-gray-900 text-gray-200" : "bg-[#fcfcfa] text-gray-800"
        }`}
        style={{
          fontSize: `${stackFontSize}px`,
          lineHeight: isFullscreen ? "1.3" : "1.4",
        }}
        aria-live="polite"
      >
        <LineStack visibleLines={visibleLines} navMode={navMode} isFullscreen={isFullscreen} />
      </div>
    </div>
  )
}
