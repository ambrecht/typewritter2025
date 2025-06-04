"use client"

import type React from "react"

import { useCallback } from "react"
import type { ParagraphRange, FormattedLine } from "@/types"
import { MarkdownType } from "@/types"

/**
 * Hook für die Formatierung von Zeilen basierend auf Markdown-Typen und Absätzen
 *
 * @param paragraphRanges - Array von Absatzbereichen
 * @param darkMode - Ob der Dark Mode aktiviert ist
 * @param selectedLineIndex - Index der ausgewählten Zeile
 * @returns Funktionen zur Formatierung von Zeilen
 */
export function useLineFormatting(
  paragraphRanges: ParagraphRange[],
  darkMode: boolean,
  selectedLineIndex: number | null,
) {
  /**
   * Überprüft, ob eine Zeile Teil eines Absatzes ist
   */
  const isLineInParagraph = useCallback(
    (index: number) => {
      return paragraphRanges.some((range) => index >= range.start && index <= range.end)
    },
    [paragraphRanges],
  )

  /**
   * Überprüft, ob eine Zeile der Beginn eines Absatzes ist
   */
  const isLineStartOfParagraph = useCallback(
    (index: number) => {
      return paragraphRanges.some((range) => index === range.start)
    },
    [paragraphRanges],
  )

  /**
   * Überprüft, ob eine Zeile das Ende eines Absatzes ist
   */
  const isLineEndOfParagraph = useCallback(
    (index: number) => {
      return paragraphRanges.some((range) => index === range.end)
    },
    [paragraphRanges],
  )

  /**
   * Rendert eine formatierte Zeile basierend auf ihrem Markdown-Typ
   */
  const renderFormattedLine = useCallback(
    (line: FormattedLine, index: number, lineRefs: React.MutableRefObject<(HTMLDivElement | null)[]>) => {
      const baseClass = `whitespace-pre-wrap break-words mb-2 font-serif ${
        darkMode ? "text-gray-200" : "text-gray-800"
      }`

      // Zusätzliche Klasse für die ausgewählte Zeile
      const isSelected = index === selectedLineIndex
      const selectedClass = isSelected
        ? `${darkMode ? "bg-gray-700" : "bg-amber-100"} rounded-md p-1 -m-1 ring-2 ${darkMode ? "ring-blue-500" : "ring-amber-400"}`
        : ""

      // Legacy-Unterstützung für Absätze
      if (isLineInParagraph(index)) {
        if (isLineStartOfParagraph(index)) {
          return {
            key: index,
            ref: (el: HTMLDivElement | null) => (lineRefs.current[index] = el),
            className: `${baseClass} paragraph-start pl-8 first-letter:text-lg first-letter:font-bold ${selectedClass}`,
            children: line.text,
          }
        } else if (isLineEndOfParagraph(index)) {
          return {
            key: index,
            ref: (el: HTMLDivElement | null) => (lineRefs.current[index] = el),
            className: `${baseClass} paragraph-end ${selectedClass}`,
            children: line.text,
          }
        } else {
          return {
            key: index,
            ref: (el: HTMLDivElement | null) => (lineRefs.current[index] = el),
            className: `${baseClass} paragraph-middle ${selectedClass}`,
            children: line.text,
          }
        }
      }

      // Neue Markdown-Formatierungen
      switch (line.type) {
        case MarkdownType.HEADING1:
          return {
            key: index,
            ref: (el: HTMLDivElement | null) => (lineRefs.current[index] = el),
            className: `text-3xl font-bold mt-6 mb-4 ${darkMode ? "text-gray-100" : "text-gray-900"} ${selectedClass}`,
            children: line.text,
            as: "h1",
          }
        case MarkdownType.HEADING2:
          return {
            key: index,
            ref: (el: HTMLDivElement | null) => (lineRefs.current[index] = el),
            className: `text-2xl font-bold mt-5 mb-3 ${darkMode ? "text-gray-100" : "text-gray-900"} ${selectedClass}`,
            children: line.text,
            as: "h2",
          }
        case MarkdownType.HEADING3:
          return {
            key: index,
            ref: (el: HTMLDivElement | null) => (lineRefs.current[index] = el),
            className: `text-xl font-bold mt-4 mb-2 ${darkMode ? "text-gray-100" : "text-gray-900"} ${selectedClass}`,
            children: line.text,
            as: "h3",
          }
        case MarkdownType.BLOCKQUOTE:
          return {
            key: index,
            ref: (el: HTMLDivElement | null) => (lineRefs.current[index] = el),
            className: `pl-4 border-l-4 ${
              darkMode ? "border-amber-600 bg-gray-800" : "border-amber-500 bg-amber-50"
            } py-2 my-4 italic ${selectedClass}`,
            children: line.text,
            as: "blockquote",
          }
        case MarkdownType.UNORDERED_LIST:
          return {
            key: index,
            ref: (el: HTMLDivElement | null) => (lineRefs.current[index] = el),
            className: `${baseClass} flex items-start ${selectedClass}`,
            children: [
              { type: "span", props: { className: "mr-2", children: "•" } },
              { type: "span", props: { children: line.text } },
            ],
          }
        case MarkdownType.ORDERED_LIST:
          return {
            key: index,
            ref: (el: HTMLDivElement | null) => (lineRefs.current[index] = el),
            className: `${baseClass} flex items-start ${selectedClass}`,
            children: [
              { type: "span", props: { className: "mr-2", children: `${line.meta?.listNumber || 1}.` } },
              { type: "span", props: { children: line.text } },
            ],
          }
        case MarkdownType.DIALOG:
          return {
            key: index,
            ref: (el: HTMLDivElement | null) => (lineRefs.current[index] = el),
            className: `${baseClass} my-3 ${selectedClass}`,
            children: [
              {
                type: "span",
                props: {
                  className: `font-bold ${darkMode ? "text-amber-400" : "text-amber-600"}`,
                  children: `${line.meta?.character}:`,
                },
              },
              " ",
              { type: "span", props: { className: "dialog-text", children: line.text } },
            ],
          }
        case MarkdownType.CODE:
          return {
            key: index,
            ref: (el: HTMLDivElement | null) => (lineRefs.current[index] = el),
            className: `${
              darkMode ? "bg-gray-800 text-gray-200" : "bg-gray-100 text-gray-800"
            } p-3 rounded-md my-4 font-mono text-sm overflow-x-auto ${selectedClass}`,
            children: { type: "code", props: { children: line.text } },
            as: "pre",
          }
        case MarkdownType.HORIZONTAL_RULE:
          return {
            key: index,
            className: `my-6 border-t ${darkMode ? "border-gray-700" : "border-gray-300"}`,
            as: "hr",
          }
        case MarkdownType.PARAGRAPH:
          return {
            key: index,
            ref: (el: HTMLDivElement | null) => (lineRefs.current[index] = el),
            className: `${baseClass} pl-8 first-letter:text-lg first-letter:font-bold ${selectedClass}`,
            children: line.text,
          }
        default:
          return {
            key: index,
            ref: (el: HTMLDivElement | null) => (lineRefs.current[index] = el),
            className: `${baseClass} ${selectedClass}`,
            children: line.text,
          }
      }
    },
    [darkMode, isLineInParagraph, isLineStartOfParagraph, isLineEndOfParagraph, selectedLineIndex],
  )

  return {
    renderFormattedLine,
  }
}
