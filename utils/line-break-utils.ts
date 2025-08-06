export interface LineBreakOptions {
  maxCharsPerLine: number
  autoMaxChars: boolean
}

// Calculate approximate number of characters per line based on container width and font size
export function calculateOptimalLineLength(containerWidth: number, fontSize: number): number {
  if (containerWidth <= 0 || fontSize <= 0) {
    // Fallback to a sensible default if measurements are missing
    return 80
  }
  // Average character width approximation factor
  const avgCharWidth = fontSize * 0.6
  return Math.max(20, Math.floor(containerWidth / avgCharWidth))
}

// Perform a single line break on the given text respecting word boundaries
export function performLineBreak(text: string, options: LineBreakOptions): {
  line: string
  remainder: string
} {
  const { maxCharsPerLine } = options
  if (text.length <= maxCharsPerLine) {
    return { line: text, remainder: "" }
  }
  const breakIndex = text.lastIndexOf(" ", maxCharsPerLine)
  if (breakIndex === -1) {
    return {
      line: text.slice(0, maxCharsPerLine),
      remainder: text.slice(maxCharsPerLine),
    }
  }
  return {
    line: text.slice(0, breakIndex),
    remainder: text.slice(breakIndex + 1),
  }
}

// Break text into multiple lines respecting existing newlines and max char limits
export function breakTextIntoLines(text: string, options: LineBreakOptions): string[] {
  const segments = text.split("\n")
  const result: string[] = []

  for (const segment of segments) {
    let current = segment
    if (current === "") {
      result.push("")
      continue
    }
    while (current.length > 0) {
      const { line, remainder } = performLineBreak(current, options)
      result.push(line)
      if (!remainder) break
      current = remainder
    }
  }

  return result
}
