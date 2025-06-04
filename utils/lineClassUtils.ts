import { MarkdownType } from "@/types"

/**
 * Berechnet die CSS-Klasse für die aktive Zeile basierend auf dem Markdown-Typ
 *
 * @param darkMode - Ob der Dark Mode aktiviert ist
 * @param activeLineType - Aktueller Markdown-Typ der aktiven Zeile
 * @param inParagraph - Ob wir uns in einem Absatz befinden
 * @returns CSS-Klasse für die aktive Zeile
 */
export function getActiveLineClass(darkMode: boolean, activeLineType: MarkdownType, inParagraph: boolean): string {
  // Im Typing-Modus: Fixierte Position am unteren Bildschirmrand
  const baseClass = `fixed bottom-0 left-0 right-0 p-4 font-serif border-t z-10 active-line ${
    darkMode
      ? "bg-gray-800 border-gray-700 shadow-[0_-8px_16px_rgba(0,0,0,0.3)]"
      : "bg-[#f3efe9] border-[#e0dcd3] shadow-[0_-8px_16px_rgba(0,0,0,0.1)]"
  }`

  switch (activeLineType) {
    case MarkdownType.HEADING1:
    case MarkdownType.HEADING2:
    case MarkdownType.HEADING3:
      return `${baseClass} heading-marker`
    case MarkdownType.BLOCKQUOTE:
      return `${baseClass} blockquote-marker`
    case MarkdownType.UNORDERED_LIST:
    case MarkdownType.ORDERED_LIST:
      return `${baseClass} list-marker`
    case MarkdownType.DIALOG:
      return `${baseClass} dialog-marker`
    case MarkdownType.CODE:
      return `${baseClass} code-marker`
    case MarkdownType.PARAGRAPH:
      return `${baseClass} paragraph-marker`
    default:
      return `${baseClass} ${inParagraph ? "paragraph-marker" : ""}`
  }
}

/**
 * Berechnet die CSS-Klasse für den Text der aktiven Zeile basierend auf dem Markdown-Typ
 *
 * @param darkMode - Ob der Dark Mode aktiviert ist
 * @param activeLineType - Aktueller Markdown-Typ der aktiven Zeile
 * @param inParagraph - Ob wir uns in einem Absatz befinden
 * @returns CSS-Klasse für den Text der aktiven Zeile
 */
export function getActiveLineTextClass(darkMode: boolean, activeLineType: MarkdownType, inParagraph: boolean): string {
  const baseClass = `whitespace-pre-wrap break-words absolute top-0 left-0 pointer-events-none overflow-hidden ${
    darkMode ? "text-gray-200" : "text-gray-800"
  }`

  switch (activeLineType) {
    case MarkdownType.HEADING1:
    case MarkdownType.HEADING2:
    case MarkdownType.HEADING3:
      return `${baseClass} font-bold ${darkMode ? "text-blue-300" : "text-blue-600"}`
    case MarkdownType.BLOCKQUOTE:
      return `${baseClass} italic ${darkMode ? "text-amber-400" : "text-amber-600"}`
    case MarkdownType.UNORDERED_LIST:
    case MarkdownType.ORDERED_LIST:
      return `${baseClass} ${darkMode ? "text-green-300" : "text-green-600"}`
    case MarkdownType.DIALOG:
      return `${baseClass} ${darkMode ? "text-purple-300" : "text-purple-600"}`
    case MarkdownType.CODE:
      return `${baseClass} font-mono ${darkMode ? "text-cyan-300" : "text-cyan-600"}`
    case MarkdownType.PARAGRAPH:
      return `${baseClass} ${darkMode ? "text-amber-400" : "text-amber-600"}`
    default:
      return `${baseClass} ${inParagraph ? "text-amber-400" : ""}`
  }
}
