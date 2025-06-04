"use client"

import { MarkdownType } from "@/types"

interface MarkdownIndicatorProps {
  type: MarkdownType
  darkMode: boolean
}

/**
 * Komponente zur Anzeige eines minimalistischen Markdown-Indikators
 */
export default function MarkdownIndicator({ type, darkMode }: MarkdownIndicatorProps) {
  // Wenn es normaler Text ist, zeige keinen Indikator an
  if (type === MarkdownType.NORMAL) return null

  // Bestimme Icon und Farbe basierend auf dem Markdown-Typ
  let icon = ""
  let color = darkMode ? "text-gray-500" : "text-gray-400"

  switch (type) {
    case MarkdownType.HEADING1:
      icon = "H1"
      color = darkMode ? "text-blue-400" : "text-blue-600"
      break
    case MarkdownType.HEADING2:
      icon = "H2"
      color = darkMode ? "text-blue-400" : "text-blue-600"
      break
    case MarkdownType.HEADING3:
      icon = "H3"
      color = darkMode ? "text-blue-400" : "text-blue-600"
      break
    case MarkdownType.BLOCKQUOTE:
      icon = "❝"
      color = darkMode ? "text-amber-400" : "text-amber-600"
      break
    case MarkdownType.UNORDERED_LIST:
      icon = "•"
      color = darkMode ? "text-green-400" : "text-green-600"
      break
    case MarkdownType.ORDERED_LIST:
      icon = "1."
      color = darkMode ? "text-green-400" : "text-green-600"
      break
    case MarkdownType.DIALOG:
      icon = "💬"
      color = darkMode ? "text-purple-400" : "text-purple-600"
      break
    case MarkdownType.CODE:
      icon = "<>"
      color = darkMode ? "text-cyan-400" : "text-cyan-600"
      break
    case MarkdownType.PARAGRAPH:
      icon = "¶"
      color = darkMode ? "text-amber-400" : "text-amber-600"
      break
    case MarkdownType.HORIZONTAL_RULE:
      icon = "—"
      color = darkMode ? "text-gray-400" : "text-gray-600"
      break
    default:
      return null
  }

  return (
    <span className={`inline-flex items-center justify-center w-5 h-5 text-xs font-mono ${color} opacity-60`}>
      {icon}
    </span>
  )
}
