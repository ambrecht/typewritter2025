import { memo } from "react"
import type { Line } from "@/types"

interface LineStackProps {
  visibleLines: { line: Line; index: number }[]
  darkMode: boolean
  stackFontSize: number
  mode: "typing" | "navigating"
  selectedLineIndex: number | null
  isFullscreen?: boolean
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
}: LineStackProps) {
  const isAndroid = typeof navigator !== "undefined" && navigator.userAgent.includes("Android")

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
      {visibleLines.map(({ line, index }) => {
        const isSelected = index === selectedLineIndex
        const selectedClass = isSelected
          ? `${darkMode ? "bg-gray-700" : "bg-amber-100"} rounded-md p-1 -m-1 ring-2 ${darkMode ? "ring-blue-500" : "ring-amber-400"}`
          : ""

        const isLastActive = index === visibleLines.length - 1 && mode === "typing"
        const lastActiveStyle = isLastActive
          ? {
              fontWeight: 500,
              backgroundColor: darkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.02)",
              borderRadius: "2px",
            }
          : {}

        return (
          <div
            key={line.id}
            className={`whitespace-pre-wrap break-words mb-2 font-serif ${selectedClass}`}
            data-line-index={index}
            style={{ margin: "0", padding: "0", ...lastActiveStyle }}
          >
            {line.text || " "} {/* Render a space for empty lines to maintain height */}
          </div>
        )
      })}
    </div>
  )
})
