"use client"

import { memo } from "react"

interface LineStackProps {
  visibleLines: { text: string; index: number; key: string }[]
}

/**
 * LineStack renders the window of visible lines.
 * - Anchored to top
 * - No gaps/margins that change height
 */
export const LineStack = memo(function LineStack({ visibleLines }: LineStackProps) {
  return (
    <div
      className="line-stack"
      style={{
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
        maxHeight: "100%",
        gap: "0",
        padding: "0",
        margin: "0",
      }}
    >
      {visibleLines.map(({ text, index, key }) => (
        <div key={key} data-line-index={index} style={{ margin: "0", padding: "0" }}>
          {text}
        </div>
      ))}
    </div>
  )
})
