/**
 * Misst die exakte Breite eines Textes für eine gegebene Schriftart und -größe mithilfe der Canvas-API.
 * @param text Der zu messende Text.
 * @param font Die CSS-Schriftdefinition (z.B. "24px serif").
 * @returns Die Breite des Textes in Pixeln.
 */
export function measureTextWidth(text: string, font: string): number {
  // Diese Funktion sollte nur auf dem Client ausgeführt werden.
  if (typeof document === "undefined") {
    return text.length * 10 // Grober Fallback für SSR
  }
  // TODO: Caching des Canvas-Kontexts könnte eine Mikro-Optimierung sein.
  const canvas = document.createElement("canvas")
  const context = canvas.getContext("2d")
  if (!context) {
    return text.length * 10 // Fallback, falls der 2D-Kontext nicht verfügbar ist.
  }
  context.font = font
  return context.measureText(text).width
}
