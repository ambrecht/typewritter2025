"use client"

import { useState, useEffect, useRef } from "react"
import { debounce } from "@/utils/debounce"

/**
 * Hook zur Verwaltung der Container-Dimensionen und Berechnung der maximalen Anzahl sichtbarer Zeilen
 * Optimiert für eine Onescreen-Ansicht ohne Scrollbalken
 *
 * @param stackFontSize - Schriftgröße für den Zeilenstack
 * @returns Objekt mit Refs und berechneten Werten
 */
export function useContainerDimensions(stackFontSize: number) {
  // Refs für DOM-Elemente
  const linesContainerRef = useRef<HTMLDivElement>(null)
  const activeLineRef = useRef<HTMLDivElement>(null)
  const lineRefs = useRef<(HTMLDivElement | null)[]>([])

  // State für Container-Dimensionen
  const [containerHeight, setContainerHeight] = useState<number | null>(null)
  const [maxVisibleLines, setMaxVisibleLines] = useState(20) // Starte mit einem höheren Wert
  const [isAndroid, setIsAndroid] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Ref für die letzte Berechnung
  const lastCalculation = useRef({
    containerHeight: 0,
    activeLineHeight: 0,
    lineHeight: 0,
    maxVisibleLines: 0,
  })

  // Zähler für Berechnungen (nur für Debugging)
  const calculationCount = useRef(0)

  // Prüfe, ob es sich um ein Android-Gerät handelt
  useEffect(() => {
    setIsAndroid(navigator.userAgent.includes("Android"))

    // Überwache Änderungen des Vollbildmodus
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange)

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange)
    }
  }, [])

  // Berechne die maximale Anzahl sichtbarer Zeilen basierend auf der Containerhöhe
  useEffect(() => {
    if (!linesContainerRef.current) return

    // Optimierte Berechnung mit Throttling
    const calculateMaxVisibleLines = debounce(() => {
      const containerHeight = linesContainerRef.current?.clientHeight || 0

      // Ändere die Berechnung der maximalen Anzahl sichtbarer Zeilen,
      // um mehr Platz für die größere aktive Zeile zu berücksichtigen

      // Schätze die Höhe der aktiven Zeile (falls noch nicht gerendert)
      const activeLineHeight = activeLineRef.current?.clientHeight || stackFontSize * 2.5 // Erhöht von 2.0 auf 2.5

      // Verfügbare Höhe für den Zeilenstack (abzüglich der aktiven Zeile)
      // Füge einen kleinen Puffer hinzu für den Abstand zwischen Stack und aktiver Zeile
      const availableHeight = containerHeight - activeLineHeight - 10 // 10px Puffer hinzugefügt

      // Berechne die Zeilenhöhe basierend auf der Schriftgröße und einem angemessenen Zeilenabstand
      // Verwende einen kleineren Zeilenabstand für mehr Zeilen
      const lineHeight = isFullscreen || isAndroid ? stackFontSize * 1.2 : stackFontSize * 1.3

      // Berechne die maximale Anzahl von Zeilen, die in den verfügbaren Platz passen
      // Wichtig: Wir wollen den gesamten verfügbaren Platz nutzen
      const visibleLines = Math.floor(availableHeight / lineHeight)

      // Stelle sicher, dass mindestens 1 Zeile sichtbar ist
      // Keine künstliche Begrenzung mehr, um den verfügbaren Platz maximal zu nutzen
      const newMaxVisibleLines = Math.max(20, visibleLines) // Mindestens 20 Zeilen

      // Prüfe, ob sich relevante Parameter geändert haben
      const hasChanged =
        Math.abs(containerHeight - lastCalculation.current.containerHeight) > 5 ||
        Math.abs(activeLineHeight - lastCalculation.current.activeLineHeight) > 2 ||
        Math.abs(lineHeight - lastCalculation.current.lineHeight) > 0.5 ||
        newMaxVisibleLines !== lastCalculation.current.maxVisibleLines

      // Nur aktualisieren, wenn sich etwas signifikant geändert hat
      if (hasChanged) {
        // Zähle Berechnungen (nur für Debugging)
        calculationCount.current += 1

        setMaxVisibleLines(newMaxVisibleLines)
        setContainerHeight(containerHeight)

        // Aktualisiere den Cache
        lastCalculation.current = {
          containerHeight,
          activeLineHeight,
          lineHeight,
          maxVisibleLines: newMaxVisibleLines,
        }
      }
    }, 300) // Längeres Debouncing für weniger häufige Berechnungen

    // Berechne initial
    calculateMaxVisibleLines()

    // Berechne bei Größenänderungen neu
    const resizeObserver = new ResizeObserver(() => {
      calculateMaxVisibleLines()
    })

    if (linesContainerRef.current) {
      resizeObserver.observe(linesContainerRef.current)
    }

    // Berechne neu, wenn sich der Vollbildmodus ändert
    const fullscreenObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === "class" && linesContainerRef.current) {
          calculateMaxVisibleLines()
        }
      })
    })

    if (linesContainerRef.current) {
      fullscreenObserver.observe(linesContainerRef.current, { attributes: true })
    }

    return () => {
      resizeObserver.disconnect()
      fullscreenObserver.disconnect()
    }
  }, [stackFontSize, isAndroid, isFullscreen])

  return {
    linesContainerRef,
    activeLineRef,
    lineRefs,
    containerHeight,
    setContainerHeight,
    maxVisibleLines,
    isAndroid,
    isFullscreen,
  }
}
