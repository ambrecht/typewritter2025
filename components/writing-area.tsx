"use client"

import type React from "react"
import { useEffect, useCallback, useRef } from "react"
import type { Line } from "@/types"

import { useVisibleLines } from "@/hooks/useVisibleLines"
import { useTypewriterStore } from "@/store/typewriter-store"
import { LineStack } from "./writing-area/LineStack"

/**
 * @interface WritingAreaProps
 * @description Props für die WritingArea Komponente.
 * Die Props für `setActiveLine`, `addLineToStack` und `hiddenInputRef` wurden entfernt,
 * da die Eingabelogik nun global gehandhabt wird.
 */
interface WritingAreaProps {
  lines: Line[]
  stackFontSize: number
  darkMode: boolean
  mode: "write" | "nav"
  offset: number
  isFullscreen: boolean
  linesContainerRef?: React.RefObject<HTMLDivElement | null>
  lineHpx?: number
}

/**
 * @component WritingArea
 * @description Die Hauptkomponente des Schreibbereichs.
 * Diese Komponente ist jetzt rein präsentationell und empfängt den darzustellenden Zustand.
 * Die Eingabelogik wurde in die `app/page.tsx` und den Store verlagert.
 */
export default function WritingArea({
  lines,
  stackFontSize,
  darkMode,
  mode,
  offset,
  isFullscreen,
  linesContainerRef: externalLinesContainerRef,
  lineHpx,
}: WritingAreaProps) {
  const internalLinesContainerRef = useRef<HTMLDivElement | null>(null)
  const maxVisibleLines = useTypewriterStore((s) => s.maxVisibleLines)

  // Kombiniere internen und externen Ref
  const setLinesContainerRef = useCallback(
    (node: HTMLDivElement | null) => {
      internalLinesContainerRef.current = node
      if (externalLinesContainerRef) {
        externalLinesContainerRef.current = node
      }
    },
    [externalLinesContainerRef, internalLinesContainerRef],
  )

  // Berechne die sichtbaren Zeilen
  const visibleLines = useVisibleLines(lines, maxVisibleLines, offset)

  useEffect(() => {
    if (internalLinesContainerRef.current) {
      internalLinesContainerRef.current.classList.toggle(
        "fullscreen-mode",
        isFullscreen,
      )
    }
  }, [isFullscreen, internalLinesContainerRef])

  return (
    <div className="flex-1 flex flex-col relative overflow-hidden font-serif">
      <div
        ref={setLinesContainerRef}
        className={`flex-1 overflow-hidden px-4 md:px-6 pt-6 writing-container flex flex-col justify-start ${
          darkMode ? "bg-gray-900 text-gray-200" : "bg-[#fcfcfa] text-gray-800"
        }`}
        style={{
          fontSize: `${stackFontSize}px`,
          lineHeight: isFullscreen ? "1.3" : "1.4",
        }}
        aria-live="polite"
      >
        <LineStack
          visibleLines={visibleLines}
          mode={mode}
          lineHpx={lineHpx}
        />
      </div>
    </div>
  )
}
