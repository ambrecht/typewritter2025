"use client"

import { useMemo } from "react"
import type { Line, FormattedLine } from "@/types"
import { MarkdownType } from "@/types"

export interface VisibleLine {
  line: FormattedLine
  index: number
  key: string
}

export function useVisibleLines(
  lines: Line[],
  maxVisibleLines: number,
  offset: number,
): VisibleLine[] {
  return useMemo(() => {
    if (lines.length === 0) return []

    const visibleCount = Math.min(maxVisibleLines, lines.length)

    const parseLine = (text: string): FormattedLine => {
      let type = MarkdownType.NORMAL
      let content = text
      let level: number | undefined
      let order: number | undefined

      const headingMatch = text.match(/^(#{1,3})\s+(.*)/)
      if (headingMatch) {
        level = headingMatch[1].length
        type =
          level === 1
            ? MarkdownType.HEADING1
            : level === 2
              ? MarkdownType.HEADING2
              : MarkdownType.HEADING3
        content = headingMatch[2]
      } else if (/^>\s+/.test(text)) {
        type = MarkdownType.BLOCKQUOTE
        content = text.replace(/^>\s+/, "")
      } else if (/^([*+-])\s+/.test(text)) {
        type = MarkdownType.UNORDERED_LIST
        content = text.replace(/^([*+-])\s+/, "")
      } else if (/^(\d+)\.\s+/.test(text)) {
        type = MarkdownType.ORDERED_LIST
        const m = text.match(/^(\d+)\.\s+/)
        if (m) order = parseInt(m[1], 10)
        content = text.replace(/^(\d+)\.\s+/, "")
      } else if (/^`{3}/.test(text)) {
        type = MarkdownType.CODE
        content = text.replace(/^`{3}/, "")
      } else if (/^"/.test(text)) {
        type = MarkdownType.DIALOG
      }

      return { text: content, type, level, order }
    }

    const start = Math.max(0, lines.length - visibleCount - offset)
    return lines.slice(start, start + visibleCount).map((line, idx) => ({
      line: parseLine(line.text),
      index: start + idx,
      key: line.id,
    }))
  }, [lines, maxVisibleLines, offset])
}
