import React from "react"
import type { FormattedLine } from "@/types"

/**
 * Creates props for rendering a formatted line inside the LineStack component.
 *
 * The function is defensive – it tries to understand the type of the line
 * (plain text, lists, separators, …) and returns the required props so that
 * `LineStack` can render the line without runtime errors even when new line
 * types appear.
 */
export function renderFormattedLine(
  line: FormattedLine,
  index: number,
  lineRefs: React.MutableRefObject<(HTMLDivElement | null)[]>,
) {
  const text = line.text ?? ""
  const explicitType = (line as any).type as string | undefined
  const base = {
    key: `line-${index}`,
    ref: (el: HTMLDivElement | null) => {
      lineRefs.current[index] = el
    },
    className: "whitespace-pre-wrap break-words relative",
  }

  // Helper to build list containers
  const buildList = (listTag: "ul" | "ol", itemText: string) => ({
    ...base,
    as: "div",
    children: [
      React.createElement(
        listTag,
        {
          className:
            listTag === "ul" ? "list-disc ml-6" : "list-decimal ml-6",
        },
        React.createElement("li", null, itemText),
      ),
    ],
  })

  // Separator line
  if (explicitType === "separator" || /^[-*_]{3,}\s*$/.test(text.trim())) {
    return {
      ...base,
      as: "hr",
      className: "border-none h-px w-full bg-gray-300 dark:bg-gray-700",
      children: undefined,
    }
  }

  // Unordered list item
  if (explicitType === "ul" || explicitType === "unordered-list") {
    const content = text.replace(/^\s*[-*+]\s*/, "")
    return buildList("ul", content)
  }

  if (explicitType === "ol" || explicitType === "ordered-list") {
    const content = text.replace(/^\s*\d+\.\s*/, "")
    return buildList("ol", content)
  }

  // Try to infer list by text if no explicit type is given
  if (/^\s*[-*+]\s+/.test(text)) {
    return buildList("ul", text.replace(/^\s*[-*+]\s*/, ""))
  }
  if (/^\s*\d+\.\s+/.test(text)) {
    return buildList("ol", text.replace(/^\s*\d+\.\s*/, ""))
  }

  // Default: plain text line
  return {
    ...base,
    as: "div",
    children: text,
  }
}
