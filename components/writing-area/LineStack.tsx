import { memo, CSSProperties } from "react"

interface LineStackProps {
  visibleLines: { line: { text: string }; index: number; key: string }[]
  mode: "typing" | "navigating"
  lineHpx?: number
}

export const LineStack = memo(function LineStack({
  visibleLines,
  mode,
  lineHpx,
}: LineStackProps) {
  return (
    <div
      className="line-stack"
      style={{
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        // Beginne im Tippmodus oben links, damit die erste Zeile an der Oberkante startet
        // und neue Zeilen darunter erscheinen
        justifyContent: mode === "navigating" ? "center" : "flex-start",
        maxHeight: "100%",
        lineHeight: "var(--lineHpx)",
        gap: "0",
        padding: "0",
        margin: "0",
        paddingBottom: "0",
        marginBottom: "0",
        ...(lineHpx ? ({ ["--lineHpx" as any]: `${lineHpx}px` } as CSSProperties) : {}),
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

