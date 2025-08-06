export interface LineBreakConfig {
  maxCharsPerLine: number
  autoMaxChars: boolean
}

export function calculateOptimalLineLength(containerWidth: number, fontSize: number): number {
  if (!containerWidth || !fontSize) {
    return 80
  }
  const avgCharWidth = fontSize * 0.6
  const length = Math.floor(containerWidth / avgCharWidth)
  return Math.max(20, Math.min(200, length))
}

export function performLineBreak(text: string, config: LineBreakConfig): { line: string; remainder: string } {
  if (text.length <= config.maxCharsPerLine) {
    return { line: text, remainder: "" }
  }
  const boundary = text.lastIndexOf(" ", config.maxCharsPerLine)
  if (boundary === -1) {
    return {
      line: text.slice(0, config.maxCharsPerLine),
      remainder: text.slice(config.maxCharsPerLine),
    }
  }
  return {
    line: text.slice(0, boundary),
    remainder: text.slice(boundary + 1),
  }
}

export function breakTextIntoLines(text: string, config: LineBreakConfig): string[] {
  const lines: string[] = []
  for (const segment of text.split(/\n/)) {
    let current = segment
    while (current.length > 0) {
      const { line, remainder } = performLineBreak(current, config)
      lines.push(line)
      if (!remainder) break
      current = remainder
    }
  }
  return lines
}
