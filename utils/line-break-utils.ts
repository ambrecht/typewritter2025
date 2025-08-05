export interface LineBreakConfig {
  maxCharsPerLine: number
  autoMaxChars: boolean
}

/**
 * Estimate an optimal line length based on container width and font size.
 * Ensures a sensible minimum and maximum number of characters.
 */
export const calculateOptimalLineLength = (
  containerWidth: number,
  fontSize: number,
): number => {
  const avgCharWidth = fontSize > 0 ? fontSize * 0.6 : 14.4
  const calculated =
    containerWidth > 0 && fontSize > 0 ? Math.floor(containerWidth / avgCharWidth) : 80
  return Math.max(20, Math.min(200, calculated))
}

/**
 * Break a text into a line and the remaining text respecting word boundaries.
 */
export const performLineBreak = (
  text: string,
  config: LineBreakConfig,
): { line: string; remainder: string } => {
  const { maxCharsPerLine } = config
  if (text.length <= maxCharsPerLine) {
    return { line: text, remainder: "" }
  }

  const breakpoint = text.lastIndexOf(" ", maxCharsPerLine)
  if (breakpoint === -1) {
    return {
      line: text.slice(0, maxCharsPerLine),
      remainder: text.slice(maxCharsPerLine),
    }
  }

  return {
    line: text.slice(0, breakpoint),
    remainder: text.slice(breakpoint + 1),
  }
}

/**
 * Break an entire block of text into lines based on the given configuration.
 */
export const breakTextIntoLines = (text: string, config: LineBreakConfig): string[] => {
  const result: string[] = []
  const paragraphs = text.split("\n")

  for (const paragraph of paragraphs) {
    let remaining = paragraph
    if (remaining === "") {
      result.push("")
      continue
    }

    while (remaining.length > 0) {
      const { line, remainder } = performLineBreak(remaining, config)
      result.push(line)
      remaining = remainder
      if (remainder === "") break
    }
  }

  return result
}

