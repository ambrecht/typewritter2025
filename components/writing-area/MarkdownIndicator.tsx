import React from "react"
import { MarkdownType } from "@/types"

interface Props {
  type: MarkdownType
  darkMode: boolean
}

export function MarkdownIndicator({ type, darkMode }: Props) {
  if (type === MarkdownType.NORMAL) return null

  const color = darkMode ? "text-gray-400" : "text-gray-500"
  const labels: Record<MarkdownType, string> = {
    [MarkdownType.NORMAL]: "",
    [MarkdownType.HEADING1]: "H1",
    [MarkdownType.HEADING2]: "H2",
    [MarkdownType.HEADING3]: "H3",
    [MarkdownType.BLOCKQUOTE]: ">",
    [MarkdownType.UNORDERED_LIST]: "•",
    [MarkdownType.ORDERED_LIST]: "1.",
    [MarkdownType.DIALOG]: "\"",
    [MarkdownType.CODE]: "{}",
    [MarkdownType.PARAGRAPH]: "¶",
  }

  return <span className={`mr-2 text-xs ${color}`}>{labels[type]}</span>
}
