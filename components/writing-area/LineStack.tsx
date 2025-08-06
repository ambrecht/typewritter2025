import { memo } from "react"
import type React from "react"

interface LineStackProps {
  visibleLines: { id: number; text: string }[]
  darkMode: boolean
  stackFontSize: number
  mode: "typing" | "navigating"
  selectedLineIndex: number | null
  isFullscreen?: boolean
  linesContainerRef?: React.RefObject<HTMLDivElement>
}

/**
 * Komponente für den Stack vorheriger Zeilen.
 * Zeigt einfache Textzeilen ohne Markdown-Formatierung an.
 */
export const LineStack = memo(function LineStack({
  visibleLines,
  darkMode,
  stackFontSize,
  mode,
  selectedLineIndex,
  isFullscreen = false,
  linesContainerRef,
}: LineStackProps) {
  const isAndroid = typeof navigator !== "undefined" && navigator.userAgent.includes("Android")

  // Reference the container ref to avoid unused variable warnings
  void linesContainerRef

  return (
    <div
      className="line-stack"
      style={{
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        justifyContent: mode === "navigating" ? "center" : "flex-end",
        maxHeight: "100%",
        lineHeight: isFullscreen ? "1.2" : isAndroid ? "1.3" : "1.5",
        gap: "0",
        padding: "0",
        margin: "0",
      }}
    >
      {visibleLines.map(({ id, text }, i) => {
        const isSelected = id === selectedLineIndex
        const selectedClass = isSelected
          ? `${darkMode ? "bg-gray-700" : "bg-amber-100"} rounded-md p-1 -m-1 ring-2 ${darkMode ? "ring-blue-500" : "ring-amber-400"}`
          : ""

        const isLastActive = i === visibleLines.length - 1 && mode === "typing"
        const lastActiveStyle = isLastActive
          ? {
              fontWeight: 500,
              backgroundColor: darkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.02)",
              borderRadius: "2px",
            }
          : {}

        return (
          <div
            key={id}
            className={`whitespace-pre-wrap break-words mb-2 font-serif ${selectedClass}`}
            data-line-index={id}
            style={{ margin: "0", padding: "0", ...lastActiveStyle }}
          >
            {text || " "} {/* Render a space for empty lines to maintain height */}
          </div>
        )
      })}
    </div>
  )
})
