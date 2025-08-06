"use client"

import React, { useCallback } from "react"
import { MarkdownType } from "@/types"

/**
 * Hook für die Verwaltung des Markdown-Typ-Indikators
 *
 * @param activeLineType - Aktueller Markdown-Typ der aktiven Zeile
 * @param darkMode - Ob der Dark Mode aktiviert ist
 * @param inParagraph - Ob wir uns in einem Absatz befinden
 * @returns Funktionen zur Anzeige des Markdown-Typ-Indikators
 */
export function useMarkdownIndicator(activeLineType: MarkdownType, darkMode: boolean, inParagraph: boolean) {
  /**
   * Rendert den Markdown-Typ-Indikator
   */
  const renderMarkdownTypeIndicator = useCallback(() => {
    if (activeLineType === MarkdownType.NORMAL && !inParagraph) return null

    const indicatorProps = {
      className: "absolute top-0 right-4 font-bold text-sm py-1",
      children: null as React.ReactNode,
    }

    if (activeLineType === MarkdownType.HEADING1) {
      indicatorProps.children = React.createElement(
        "span",
        { className: darkMode ? "text-blue-300" : "text-blue-600" },
        "Überschrift 1",
      )
    } else if (activeLineType === MarkdownType.HEADING2) {
      indicatorProps.children = React.createElement(
        "span",
        { className: darkMode ? "text-blue-300" : "text-blue-600" },
        "Überschrift 2",
      )
    } else if (activeLineType === MarkdownType.HEADING3) {
      indicatorProps.children = React.createElement(
        "span",
        { className: darkMode ? "text-blue-300" : "text-blue-600" },
        "Überschrift 3",
      )
    } else if (activeLineType === MarkdownType.BLOCKQUOTE) {
      indicatorProps.children = React.createElement(
        "span",
        { className: darkMode ? "text-amber-400" : "text-amber-600" },
        "Zitat",
      )
    } else if (activeLineType === MarkdownType.UNORDERED_LIST) {
      indicatorProps.children = React.createElement(
        "span",
        { className: darkMode ? "text-green-300" : "text-green-600" },
        "Liste",
      )
    } else if (activeLineType === MarkdownType.ORDERED_LIST) {
      indicatorProps.children = React.createElement(
        "span",
        { className: darkMode ? "text-green-300" : "text-green-600" },
        "Nummerierte Liste",
      )
    } else if (activeLineType === MarkdownType.DIALOG) {
      indicatorProps.children = React.createElement(
        "span",
        { className: darkMode ? "text-purple-300" : "text-purple-600" },
        "Dialog",
      )
    } else if (activeLineType === MarkdownType.CODE) {
      indicatorProps.children = React.createElement(
        "span",
        { className: darkMode ? "text-cyan-300" : "text-cyan-600" },
        "Code",
      )
    } else if (activeLineType === MarkdownType.PARAGRAPH) {
      indicatorProps.children = React.createElement(
        "span",
        { className: darkMode ? "text-amber-400" : "text-amber-600" },
        "Absatz",
      )
    } else if (inParagraph && activeLineType === MarkdownType.NORMAL) {
      indicatorProps.children = React.createElement(
        "span",
        { className: "text-amber-500 font-bold" },
        "Absatz aktiv",
      )
    }

    return indicatorProps
  }, [activeLineType, darkMode, inParagraph])

  return {
    renderMarkdownTypeIndicator,
  }
}
