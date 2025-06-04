"use client"

import { useEffect, useState } from "react"
import { MarkdownType } from "@/types"

interface ActiveLinePreviewProps {
  text: string
  activeLineType: MarkdownType
  darkMode: boolean
}

/**
 * Zeigt eine Echtzeit-Vorschau der Markdown-Formatierung für die aktive Zeile
 */
export default function ActiveLinePreview({ text, activeLineType, darkMode }: ActiveLinePreviewProps) {
  const [previewText, setPreviewText] = useState("")
  const [isVisible, setIsVisible] = useState(false)

  // Aktualisiere die Vorschau basierend auf dem Markdown-Typ
  useEffect(() => {
    // Unterstütze Zeilenumbrüche in der Vorschau
    const processedText = text.includes("\n") ? text : text

    switch (activeLineType) {
      case MarkdownType.HEADING1:
        setPreviewText(processedText)
        setIsVisible(true)
        break
      case MarkdownType.HEADING2:
        setPreviewText(processedText)
        setIsVisible(true)
        break
      case MarkdownType.HEADING3:
        setPreviewText(processedText)
        setIsVisible(true)
        break
      case MarkdownType.BLOCKQUOTE:
        setPreviewText(processedText)
        setIsVisible(true)
        break
      case MarkdownType.UNORDERED_LIST:
        setPreviewText(processedText)
        setIsVisible(true)
        break
      case MarkdownType.ORDERED_LIST:
        const match = processedText.match(/^(\d+)\.\s(.+)$/)
        setPreviewText(match ? match[2] : processedText)
        setIsVisible(true)
        break
      case MarkdownType.DIALOG:
        const dialogMatch = processedText.match(/^-\s([^:]+):\s(.+)$/)
        setPreviewText(dialogMatch ? dialogMatch[2] : processedText)
        setIsVisible(true)
        break
      case MarkdownType.CODE:
        if (processedText.startsWith("```") && processedText.endsWith("```")) {
          setPreviewText(processedText.substring(3, processedText.length - 3))
        } else {
          setPreviewText(processedText)
        }
        setIsVisible(true)
        break
      case MarkdownType.PARAGRAPH:
        if (processedText.startsWith("***") && processedText.endsWith("***")) {
          setPreviewText(processedText.substring(3, processedText.length - 3))
        } else {
          setPreviewText(processedText)
        }
        setIsVisible(true)
        break
      default:
        setPreviewText(processedText)
        setIsVisible(false)
    }
  }, [text, activeLineType])

  // Wenn keine Vorschau angezeigt werden soll, gib null zurück
  if (!isVisible) return null

  // Rendere die Vorschau basierend auf dem Markdown-Typ
  const renderPreview = () => {
    const baseClass = `whitespace-pre-wrap break-words ${darkMode ? "text-gray-200" : "text-gray-800"}`

    // Unterstütze Zeilenumbrüche in der Vorschau
    const formattedText = previewText.split("\n").map((line, i) => (
      <span key={i}>
        {line}
        {i < previewText.split("\n").length - 1 && <br />}
      </span>
    ))

    switch (activeLineType) {
      case MarkdownType.HEADING1:
        return <h1 className={`text-3xl font-bold ${darkMode ? "text-gray-100" : "text-gray-900"}`}>{formattedText}</h1>
      case MarkdownType.HEADING2:
        return <h2 className={`text-2xl font-bold ${darkMode ? "text-gray-100" : "text-gray-900"}`}>{formattedText}</h2>
      case MarkdownType.HEADING3:
        return <h3 className={`text-xl font-bold ${darkMode ? "text-gray-100" : "text-gray-900"}`}>{formattedText}</h3>
      case MarkdownType.BLOCKQUOTE:
        return (
          <blockquote
            className={`pl-4 border-l-4 ${
              darkMode ? "border-amber-600 bg-gray-800" : "border-amber-500 bg-amber-50"
            } py-2 italic`}
          >
            {formattedText}
          </blockquote>
        )
      case MarkdownType.UNORDERED_LIST:
        return (
          <div className={`${baseClass} flex items-start`}>
            <span className="mr-2">•</span>
            <span>{formattedText}</span>
          </div>
        )
      case MarkdownType.ORDERED_LIST:
        return (
          <div className={`${baseClass} flex items-start`}>
            <span className="mr-2">1.</span>
            <span>{formattedText}</span>
          </div>
        )
      case MarkdownType.DIALOG:
        return (
          <div className={`${baseClass}`}>
            <span className={`font-bold ${darkMode ? "text-amber-400" : "text-amber-600"}`}>Character:</span>{" "}
            <span className="dialog-text">{formattedText}</span>
          </div>
        )
      case MarkdownType.CODE:
        return (
          <pre
            className={`${
              darkMode ? "bg-gray-800 text-gray-200" : "bg-gray-100 text-gray-800"
            } p-3 rounded-md font-mono text-sm overflow-x-auto`}
          >
            <code>{formattedText}</code>
          </pre>
        )
      case MarkdownType.PARAGRAPH:
        return <div className={`${baseClass} pl-8 first-letter:text-lg first-letter:font-bold`}>{formattedText}</div>
      default:
        return <div className={baseClass}>{formattedText}</div>
    }
  }

  return (
    <div className="markdown-preview">
      <div className="text-xs mb-1 font-medium">Vorschau:</div>
      {renderPreview()}
    </div>
  )
}
