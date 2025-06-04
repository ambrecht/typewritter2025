import { MarkdownType, type FormattedLine } from "@/types"

/**
 * Parst eine Textzeile, um ihren Markdown-Typ zu bestimmen
 *
 * @param text - Die zu parsende Textzeile
 * @returns Ein FormattedLine-Objekt mit Typ und Metadaten
 */
export const parseMarkdownLine = (text: string): FormattedLine => {
  // Prüfe auf Absatzmarkierungen (höchste Priorität)
  if (text.includes("***")) {
    // Wenn die Zeile mit *** beginnt und endet, ist es ein Absatz
    if (text.trim().startsWith("***") && text.trim().endsWith("***")) {
      const content = text.trim().substring(3, text.trim().length - 3)
      return { text: content, type: MarkdownType.PARAGRAPH }
    }

    // Wenn die Zeile nur *** enthält, ist es ein Absatzmarker
    if (text.trim() === "***") {
      return { text: "", type: MarkdownType.PARAGRAPH }
    }
  }

  // Prüfe auf Überschriften
  if (text.trim().startsWith("# ")) {
    return { text: text.trim().substring(2), type: MarkdownType.HEADING1 }
  } else if (text.trim().startsWith("## ")) {
    return { text: text.trim().substring(3), type: MarkdownType.HEADING2 }
  } else if (text.trim().startsWith("### ")) {
    return { text: text.trim().substring(4), type: MarkdownType.HEADING3 }
  }

  // Prüfe auf Blockzitate
  if (text.trim().startsWith("> ")) {
    return { text: text.trim().substring(2), type: MarkdownType.BLOCKQUOTE }
  }

  // Prüfe auf ungeordnete Listen
  if (text.trim().startsWith("- ") || text.trim().startsWith("* ")) {
    return {
      text: text.trim().substring(2),
      type: MarkdownType.UNORDERED_LIST,
      meta: { indentLevel: 0 },
    }
  }

  // Prüfe auf geordnete Listen
  const orderedListMatch = text.trim().match(/^(\d+)\.\s(.+)$/)
  if (orderedListMatch) {
    return {
      text: orderedListMatch[2],
      type: MarkdownType.ORDERED_LIST,
      meta: {
        listNumber: Number.parseInt(orderedListMatch[1], 10),
        indentLevel: 0,
      },
    }
  }

  // Prüfe auf Dialog
  const dialogMatch = text.trim().match(/^-\s([^:]+):\s(.+)$/)
  if (dialogMatch) {
    return {
      text: dialogMatch[2],
      type: MarkdownType.DIALOG,
      meta: { character: dialogMatch[1] },
    }
  }

  // Prüfe auf Code-Blöcke
  if (text.trim().startsWith("```") && text.trim().endsWith("```") && text.trim().length > 6) {
    return { text: text.trim().substring(3, text.trim().length - 3), type: MarkdownType.CODE }
  } else if (text.trim().startsWith("`") && text.trim().endsWith("`") && text.trim().length > 2) {
    // Inline-Code wird als normaler Text mit spezieller Formatierung behandelt
    return { text: text.trim(), type: MarkdownType.NORMAL }
  }

  // Prüfe auf horizontale Linien
  if (text.trim() === "---" || text.trim() === "***" || text.trim() === "___") {
    return { text: "", type: MarkdownType.HORIZONTAL_RULE }
  }

  // Standard: normaler Text
  return { text, type: MarkdownType.NORMAL }
}

/**
 * Prüft, ob eine Zeile die Fortsetzung eines Markdown-Blocks sein könnte
 *
 * @param prevLineType - Der Markdown-Typ der vorherigen Zeile
 * @param currentLine - Die aktuelle Zeile
 * @returns true, wenn die Zeile eine Fortsetzung sein könnte
 */
export const isContinuationOfMarkdown = (prevLineType: MarkdownType, currentLine: string): boolean => {
  // Wenn die vorherige Zeile eine Überschrift, horizontale Linie oder Absatzmarker war,
  // kann die aktuelle Zeile keine Fortsetzung sein
  if (
    prevLineType === MarkdownType.HEADING1 ||
    prevLineType === MarkdownType.HEADING2 ||
    prevLineType === MarkdownType.HEADING3 ||
    prevLineType === MarkdownType.HORIZONTAL_RULE
  ) {
    return false
  }

  // Wenn die aktuelle Zeile mit einem Markdown-Marker beginnt, ist sie keine Fortsetzung
  if (
    currentLine.trim().startsWith("#") ||
    currentLine.trim().startsWith(">") ||
    currentLine.trim().startsWith("-") ||
    currentLine.trim().startsWith("*") ||
    currentLine.trim().startsWith("```") ||
    currentLine.trim() === "---" ||
    currentLine.trim() === "***" ||
    currentLine.trim() === "___" ||
    currentLine.trim().match(/^\d+\.\s/)
  ) {
    return false
  }

  // Bei Blockzitaten, Listen und Code-Blöcken kann die aktuelle Zeile eine Fortsetzung sein
  if (
    prevLineType === MarkdownType.BLOCKQUOTE ||
    prevLineType === MarkdownType.UNORDERED_LIST ||
    prevLineType === MarkdownType.ORDERED_LIST ||
    prevLineType === MarkdownType.CODE ||
    prevLineType === MarkdownType.DIALOG
  ) {
    return true
  }

  // Bei normalen Absätzen kann die aktuelle Zeile eine Fortsetzung sein,
  // wenn sie nicht leer ist und nicht mit einem Markdown-Marker beginnt
  return currentLine.trim() !== ""
}

/**
 * Verarbeitet mehrere Zeilen und wendet Markdown-Formatierung an
 *
 * @param lines - Array von Textzeilen
 * @returns Array von formatierten Zeilen
 */
export const processMultilineMarkdown = (lines: string[]): FormattedLine[] => {
  if (lines.length === 0) return []

  const result: FormattedLine[] = []
  let currentType: MarkdownType = MarkdownType.NORMAL
  let currentMeta: any = {}
  let inCodeBlock = false
  let codeBlockContent = ""

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Behandle leere Zeilen als normalen Text
    if (!line.trim()) {
      result.push({
        text: "",
        type: MarkdownType.NORMAL,
      })
      currentType = MarkdownType.NORMAL
      continue
    }

    // Spezialfall: Code-Blöcke
    if (line.trim().startsWith("```") && !inCodeBlock) {
      inCodeBlock = true
      codeBlockContent = line.trim().substring(3) + "\n"
      continue
    } else if (line.trim().endsWith("```") && inCodeBlock) {
      inCodeBlock = false
      codeBlockContent += line.trim().substring(0, line.trim().length - 3)
      result.push({
        text: codeBlockContent,
        type: MarkdownType.CODE,
      })
      codeBlockContent = ""
      currentType = MarkdownType.NORMAL
      continue
    } else if (inCodeBlock) {
      codeBlockContent += line + "\n"
      continue
    }

    // Normale Markdown-Verarbeitung
    const parsedLine = parseMarkdownLine(line)

    // Prüfe, ob diese Zeile eine Fortsetzung der vorherigen ist
    if (i > 0 && isContinuationOfMarkdown(currentType, line)) {
      // Wenn es eine Fortsetzung ist, behalte den Typ bei und füge den Text hinzu
      const lastIndex = result.length - 1
      if (lastIndex >= 0) {
        result[lastIndex].text += "\n" + line
      } else {
        // Fallback, falls keine vorherige Zeile existiert
        result.push(parsedLine)
      }
    } else {
      // Wenn es keine Fortsetzung ist, füge eine neue Zeile hinzu
      result.push(parsedLine)
      currentType = parsedLine.type
      currentMeta = parsedLine.meta || {}
    }
  }

  return result
}
