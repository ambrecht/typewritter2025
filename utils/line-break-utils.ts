import type { LineBreakConfig, LineBreakResult } from "@/types"

// Cache Android-Detection für bessere Performance
const IS_ANDROID = typeof navigator !== "undefined" && navigator.userAgent.includes("Android")
const IS_MOBILE = typeof window !== "undefined" && window.innerWidth < 768

const DEFAULT_LINE_BREAK_CONFIG: LineBreakConfig = {
  maxCharsPerLine: 56,
  autoMaxChars: true,
}

/**
 * Berechnet die optimale Zeilenlänge basierend auf der Containerbreite
 * Vollständig überarbeitete Version für maximale Platznutzung
 *
 * @param containerWidth - Breite des Containers in Pixeln
 * @param fontSize - Schriftgröße in Pixeln
 * @returns Optimale Anzahl von Zeichen pro Zeile
 */
export const calculateOptimalLineLength = (containerWidth: number, fontSize: number): number => {
  if (!containerWidth || containerWidth <= 0) containerWidth = 800
  if (!fontSize || fontSize <= 0) fontSize = 24

  // Verwende gecachte Werte statt wiederholte Berechnungen
  const isMobile = IS_MOBILE
  const avgCharWidth = fontSize * (isMobile ? 0.5 : 0.55)
  const padding = isMobile ? 24 : 16
  const availableWidth = containerWidth > padding ? containerWidth - padding : containerWidth * 0.95

  let maxChars = Math.floor(availableWidth / avgCharWidth)

  // Optimierte Landscape-Erkennung
  const isLandscape = typeof window !== "undefined" && window.innerWidth > window.innerHeight
  if (isMobile && isLandscape) {
    maxChars = Math.min(maxChars, 100)
  }

  maxChars = Math.min(maxChars, 200)
  maxChars = Math.max(maxChars, 20)
  maxChars = Math.floor(maxChars * 0.98)

  return maxChars
}

/**
 * Teilt den Eingabetext in zwei Teile: Text, der in die aktuelle Zeile passt,
 * und den Rest für die nächste Zeile.
 * Überarbeitete Version für bessere Wortumbrüche.
 *
 * @param text - Der zu teilende Text
 * @param config - Konfiguration für den Zeilenumbruch
 * @returns Ein Objekt mit der aktuellen Zeile und dem Rest
 */
export const performLineBreak = (
  text: string,
  config: LineBreakConfig = DEFAULT_LINE_BREAK_CONFIG,
): LineBreakResult => {
  const { maxCharsPerLine } = config

  // Wenn der Text bereits innerhalb des Limits liegt, ist kein Umbruch erforderlich
  if (text.length <= maxCharsPerLine) {
    return { line: text, remainder: "" }
  }

  // Finde das letzte Leerzeichen vor dem Umbruchpunkt
  // Wir suchen jetzt bis zum absoluten Ende der Zeile
  const lastSpace = text.lastIndexOf(" ", maxCharsPerLine)

  // Wenn ein Leerzeichen gefunden wurde und es nicht zu weit vom Ende entfernt ist
  // Wir erlauben jetzt Umbrüche bei Leerzeichen, die näher am Anfang sind
  if (lastSpace > Math.floor(maxCharsPerLine * 0.2)) {
    // Reduziert von 0.3
    // Teile den Text am Leerzeichen
    const line = text.substring(0, lastSpace).trimEnd()
    const remainder = text.substring(lastSpace + 1)
    return { line, remainder }
  } else {
    // Wenn kein geeignetes Leerzeichen gefunden wurde, breche bei maxCharsPerLine ab
    // Wir gehen jetzt bis zum absoluten Maximum
    const line = text.substring(0, maxCharsPerLine)
    const remainder = text.substring(maxCharsPerLine).trimStart()
    return { line, remainder }
  }
}

/**
 * Führt den Umbruchprozess mehrmals durch, um den gesamten Text
 * in Zeilen zu unterteilen, die der Konfiguration entsprechen.
 *
 * @param text - Der zu teilende Text
 * @param config - Konfiguration für den Zeilenumbruch
 * @returns Ein Array von Textzeilen
 */
export const breakTextIntoLines = (text: string, config: LineBreakConfig = DEFAULT_LINE_BREAK_CONFIG): string[] => {
  // Wenn der Text Zeilenumbrüche enthält, respektiere diese
  if (text.includes("\n")) {
    return text.split("\n")
  }

  let remainingText = text
  const lines: string[] = []

  // Sicherheitsmaßnahme, um Endlosschleifen zu vermeiden
  const maxIterations = 1000
  let iterations = 0

  while (remainingText.length > 0 && iterations < maxIterations) {
    iterations++

    const { line, remainder } = performLineBreak(remainingText, config)
    lines.push(line)

    // Wenn kein Rest übrig ist oder keine Änderung eingetreten ist, beende die Schleife
    if (remainder === "" || remainder === remainingText) {
      if (remainder !== "") {
        lines.push(remainder)
      }
      break
    }

    remainingText = remainder
  }

  return lines
}
