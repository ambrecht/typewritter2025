import type React from "react"
import type { FormattedLine } from "@/types"
import { MarkdownType } from "@/types"

/**
 * Wandelt eine formatierte Zeile in React-Props um, die von LineStack gerendert werden können
 */
export function renderFormattedLine(
  line: FormattedLine,
  index: number,
  lineRefs: React.MutableRefObject<(HTMLDivElement | null)[]>,
) {
  const refCallback = (el: HTMLDivElement | null) => {
    lineRefs.current[index] = el
  }

  const baseProps = {
    ref: refCallback,
    className: "whitespace-pre-wrap break-words",
    children: line.text,
  }

  switch (line.type) {
    case MarkdownType.HEADING1:
      return { as: "h1", ...baseProps }
    case MarkdownType.HEADING2:
      return { as: "h2", ...baseProps }
    case MarkdownType.HEADING3:
      return { as: "h3", ...baseProps }
    case MarkdownType.BLOCKQUOTE:
      return { as: "blockquote", ...baseProps }
    case MarkdownType.CODE:
      return { as: "pre", ...baseProps }
    case MarkdownType.ORDERED_LIST:
    case MarkdownType.UNORDERED_LIST:
      return { as: "div", ...baseProps }
    default:
      return { as: "div", ...baseProps }
  }
}
