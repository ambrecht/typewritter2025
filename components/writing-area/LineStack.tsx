import type React from "react"
import type { FormattedLine } from "@/types"
import { memo } from "react"

interface LineStackProps {
  visibleLines: { id: number; text: string }[]
  darkMode: boolean
  stackFontSize: number
  mode: "typing" | "navigating"
  selectedLineIndex: number | null
  isFullscreen?: boolean
  linesContainerRef?: React.RefObject<HTMLDivElement>
}

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
        overflowY: "auto",
        overflowX: "hidden",
        display: "flex",
        flexDirection: "column",
        // Beginne im Tippmodus oben links, damit die erste Zeile an der Oberkante startet
        // und neue Zeilen darunter erscheinen
        justifyContent: mode === "navigating" ? "center" : "flex-start",
        maxHeight: "100%",
        lineHeight: isFullscreen ? "1.2" : isAndroid ? "1.3" : "1.5",
        gap: "0",
        padding: "0",
        margin: "0",
        paddingBottom: "0",
        marginBottom: "0",
      }}
    >
      {visibleLines.map(({ line, index, key }) => {
        const elementKey = key || index
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
            key={elementKey}
            ref={(el) => (lineRefs.current[index] = el)}
            className={`whitespace-pre-wrap break-words mb-2 font-serif ${darkMode ? "text-gray-200" : "text-gray-800"}`}
            data-line-index={index}
            style={{ margin: "0", padding: "0", ...lastActiveStyle }}
          >
            {line.text}
          </div>
        )
      })}
    </div>
  )
})
