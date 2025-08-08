"use client"

import { useState, useEffect } from "react"
import { useTypewriterStore } from "@/store/typewriter-store"

interface DebugInfoProps {
  containerWidth: number
  fontSize: number
  darkMode: boolean
  mode: "write" | "nav"
  selectedLineIndex: number | null
  scrollPosition: number
}

export default function DebugInfo({
  containerWidth,
  fontSize,
  darkMode,
  mode,
  selectedLineIndex,
  scrollPosition,
}: DebugInfoProps) {
  const { lineBreakConfig, maxCharsPerLine } = useTypewriterStore()
  const [viewportInfo, setViewportInfo] = useState({
    width: 0,
    height: 0,
    availableWidth: 0,
  })

  useEffect(() => {
    const updateViewportInfo = () => {
      if (typeof window !== "undefined") {
        setViewportInfo({
          width: window.innerWidth,
          height: window.innerHeight,
          availableWidth: containerWidth,
        })
      }
    }

    updateViewportInfo()
    window.addEventListener("resize", updateViewportInfo)

    return () => {
      window.removeEventListener("resize", updateViewportInfo)
    }
  }, [containerWidth])

  // Berechne die theoretische Zeichenbreite
  const theoreticalCharWidth = containerWidth / maxCharsPerLine

  return (
    <div
      className={`fixed bottom-12 right-4 p-3 rounded-lg shadow-lg text-xs z-50 ${
        darkMode ? "bg-gray-800 text-gray-200" : "bg-white text-gray-800"
      } transition-opacity duration-300 opacity-60 hover:opacity-100`}
    >
      <h3 className="font-bold mb-1">Debug Info</h3>
      <div>Container: {containerWidth}px</div>
      <div>
        Viewport: {viewportInfo.width}x{viewportInfo.height}px
      </div>
      <div>Font Size: {fontSize}px</div>
      <div>Max Chars: {maxCharsPerLine}</div>
      <div>Char Width: ~{theoreticalCharWidth.toFixed(2)}px</div>
      <div>Auto: {lineBreakConfig.autoMaxChars ? "Yes" : "No"}</div>

      {/* Neue Debug-Informationen */}
      <div className="mt-2 pt-2 border-t border-gray-700">
        <div>
          Mode: <span className="font-mono">{mode}</span>
        </div>
        <div>Selected Line: {selectedLineIndex !== null ? selectedLineIndex : "none"}</div>
        <div>Scroll Position: {scrollPosition}px</div>
      </div>
    </div>
  )
}
