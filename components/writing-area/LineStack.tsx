import type React from "react"
import type { FormattedLine } from "@/types"
import { useLineFormatting } from "../../hooks/useLineFormatting"
import { memo } from "react"

// Importiere den Markdown-Indikator
import MarkdownIndicator from "../markdown-indicator"

interface LineStackProps {
  visibleLines: { line: FormattedLine; index: number }[]
  lineRefs: React.MutableRefObject<(HTMLDivElement | null)[]>
  darkMode: boolean
  stackFontSize: number
  mode: "typing" | "navigating"
  fontSize: number
  paragraphRanges: any[]
  selectedLineIndex: number | null
  isFullscreen?: boolean
}

/**
 * Komponente für den Stack vorheriger Zeilen
 * Strikt begrenzt auf die sichtbaren Zeilen ohne Scrollbalken
 * Memoized für bessere Performance
 */
export const LineStack = memo(function LineStack({
  visibleLines,
  lineRefs,
  darkMode,
  stackFontSize,
  mode,
  fontSize,
  paragraphRanges,
  selectedLineIndex,
  isFullscreen = false,
}: LineStackProps) {
  const { renderFormattedLine } = useLineFormatting(paragraphRanges, darkMode, selectedLineIndex)

  // Prüfe, ob es sich um ein Android-Gerät handelt
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
        // Minimaler Zeilenabstand für maximale Platznutzung
        lineHeight: isFullscreen ? "1.2" : isAndroid ? "1.3" : "1.5", // Verbesserte Zeilenhöhe für bessere Lesbarkeit
        // Kein Abstand zwischen den Zeilen
        gap: "0",
        // Wichtig: Kein Padding oder Margin
        padding: "0",
        margin: "0",
        // Wichtig: Kein Abstand nach unten
        paddingBottom: "0",
        marginBottom: "0",
      }}
    >
      {/* Zeige nur die berechneten sichtbaren Zeilen an */}
      {visibleLines.map(({ line, index, key }) => {
        const props = renderFormattedLine(line, index, lineRefs)
        const { as = "div", ...restProps } = props

        // Verwende den generierten key, wenn vorhanden, sonst den Standard-key
        const elementKey = key || props.key

        // Prüfe, ob dies die zuletzt aktive Zeile ist (direkt über der aktuellen Schreibzeile)
        const isLastActive = index === visibleLines.length - 1 && mode === "typing"

        // Füge zusätzliche Styling für die zuletzt aktive Zeile hinzu
        const lastActiveStyle = isLastActive
          ? {
              fontWeight: 500,
              backgroundColor: darkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.02)",
              borderRadius: "2px",
            }
          : {}

        // Dynamisch das richtige Element basierend auf 'as' erstellen
        const ElementType = as as keyof React.JSX.IntrinsicElements

        if (as === "hr") {
          return <hr key={elementKey} className={props.className} data-line-index={index} style={{ margin: "0" }} />
        }

        if (ElementType === "div" && Array.isArray(props.children)) {
          // Für Listen und Dialog mit mehreren Kindern
          return (
            <div
              key={elementKey}
              ref={props.ref}
              className={props.className}
              data-line-index={index}
              // Kein Abstand für maximale Platznutzung
              style={{ margin: "0", padding: "0", ...lastActiveStyle }}
            >
              {/* Füge den Markdown-Indikator hinzu */}
              <MarkdownIndicator type={line.type} darkMode={darkMode} />
              {props.children.map((child: any, i: number) => {
                if (typeof child === "string") return child
                const ChildType = child.type as keyof React.JSX.IntrinsicElements
                return <ChildType key={i} {...child.props} />
              })}
            </div>
          )
        }

        // Und auch für einfache Elemente
        return (
          <ElementType
            key={elementKey}
            ref={props.ref}
            className={props.className}
            data-line-index={index}
            // Kein Abstand für maximale Platznutzung
            style={{ margin: "0", padding: "0", ...lastActiveStyle }}
          >
            {/* Füge den Markdown-Indikator hinzu */}
            <MarkdownIndicator type={line.type} darkMode={darkMode} />
            {props.children}
          </ElementType>
        )
      })}
    </div>
  )
})
