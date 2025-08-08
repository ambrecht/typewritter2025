import { memo } from "react"
import { MarkdownIndicator } from "./MarkdownIndicator"
import { renderFormattedLine } from "./renderFormattedLine"

interface LineStackProps {
  visibleLines: { line: { text: string }; index: number; key: string }[]
  navMode: boolean
  isFullscreen?: boolean
}

export const LineStack = memo(function LineStack({
  visibleLines,
  navMode,
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
        // Beginne im Tippmodus oben links, damit die erste Zeile an der Oberkante startet
        // und neue Zeilen darunter erscheinen
        justifyContent: navMode ? "center" : "flex-start",
        maxHeight: "100%",
        lineHeight: isFullscreen ? "1.2" : isAndroid ? "1.3" : "1.5",
        gap: "0",
        padding: "0",
        margin: "0",
        paddingBottom: "0",
        marginBottom: "0",
      }}
    >
      {visibleLines.map(({ line, index, key }) => (
        <div key={key} data-line-index={index} style={{ margin: "0", padding: "0" }}>
          {line.text}
        </div>
      ))}
    </div>
  )
})
