import type React from "react"
import type { FormattedLine } from "@/types"
import { memo } from "react"

interface LineStackProps {
  visibleLines: { line: FormattedLine; index: number; key: string }[]
  lineRefs: React.MutableRefObject<(HTMLDivElement | null)[]>
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
        const props = renderFormattedLine(line, index, lineRefs) as any
        const { as = "div", ...restProps } = props

        // Verwende den generierten key, wenn vorhanden, sonst den Standard-key
        const elementKey = key || props.key

        // Prüfe, ob dies die zuletzt aktive Zeile ist (direkt über der aktuellen Schreibzeile)
        const isLastActive = index === visibleLines.length - 1 && mode === "typing"
        const lastActiveStyle = isLastActive
          ? {
              fontWeight: 500,
              backgroundColor: darkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.02)",
              borderRadius: "2px",
            }
          : {}

        // Dynamisch das richtige Element basierend auf 'as' erstellen
        const ElementType = as as React.ElementType

        if (as === "hr") {
          return <hr key={elementKey} className={props.className} data-line-index={index} style={{ margin: "0" }} />
        }

        if (ElementType === "div" && Array.isArray(props.children)) {
          // Für Listen und Dialog mit mehreren Kindern
          return (
            <div
              key={elementKey}
              ref={(el: HTMLElement | null) => {
                if (typeof props.ref === "function") {
                  ;(props.ref as (instance: HTMLElement | null) => void)(el)
                } else if (props.ref && "current" in props.ref) {
                  ;(props.ref as React.MutableRefObject<HTMLElement | null>).current =
                    el
                }
              }}
              className={props.className}
              data-line-index={index}
              // Kein Abstand für maximale Platznutzung
              style={{ margin: "0", padding: "0", ...lastActiveStyle }}
            >
              {/* Füge den Markdown-Indikator hinzu */}
              <MarkdownIndicator type={line.type} darkMode={darkMode} />
              {(props.children as any[]).map((child: any, i: number) => {
                if (typeof child === "string") return child
                const ChildType = child.type as React.ElementType
                return <ChildType key={i} {...(child.props as any)} />
              })}
            </div>
          )
        }

        // Und auch für einfache Elemente
        const Element = ElementType as React.ElementType
        return (
          <Element
            key={elementKey}
            ref={(el: HTMLElement | null) => {
              if (typeof props.ref === "function") {
                ;(props.ref as (instance: HTMLElement | null) => void)(el)
              } else if (props.ref && "current" in props.ref) {
                ;(props.ref as React.MutableRefObject<HTMLElement | null>).current =
                  el
              }
            }}
            className={props.className}
            data-line-index={index}
            style={{ margin: "0", padding: "0", ...lastActiveStyle }}
          >
            {/* Füge den Markdown-Indikator hinzu */}
            <MarkdownIndicator type={line.type} darkMode={darkMode} />
            {props.children as React.ReactNode}
          </Element>
        )
      })}
    </div>
  )
})
