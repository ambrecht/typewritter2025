import type { TextStatistics } from "@/types"

/**
 * Berechnet Textstatistiken wie Wortanzahl, Buchstabenanzahl und Seitenanzahl
 *
 * @param text - Der zu analysierende Text
 * @returns Ein TextStatistics-Objekt mit den berechneten Werten
 */
export const calculateTextStatistics = (text: string): TextStatistics => {
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length
  const letterCount = text.replace(/\s+/g, "").length
  const pageCount = Math.floor(text.length / 1600)

  return {
    wordCount,
    letterCount,
    pageCount,
  }
}
