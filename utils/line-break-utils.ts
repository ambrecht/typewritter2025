export interface LineBreakOptions {
  maxCharsPerLine: number;
  autoMaxChars: boolean;
}

export function calculateOptimalLineLength(containerWidth: number, fontSize: number): number {
  const width = containerWidth > 0 ? containerWidth : 800;
  const size = fontSize > 0 ? fontSize : 16;
  const approxCharWidth = size * 0.6;
  return Math.max(20, Math.floor(width / approxCharWidth));
}

export function performLineBreak(
  text: string,
  { maxCharsPerLine }: LineBreakOptions,
): { line: string; remainder: string } {
  if (text.length <= maxCharsPerLine) {
    return { line: text, remainder: "" };
  }
  let breakIndex = text.lastIndexOf(" ", maxCharsPerLine);
  if (breakIndex === -1) {
    breakIndex = maxCharsPerLine;
    return {
      line: text.slice(0, breakIndex),
      remainder: text.slice(breakIndex),
    };
  }
  return {
    line: text.slice(0, breakIndex),
    remainder: text.slice(breakIndex + 1),
  };
}

export function breakTextIntoLines(text: string, options: LineBreakOptions): string[] {
  const result: string[] = [];
  const segments = text.split("\n");
  for (const segment of segments) {
    if (segment === "") {
      result.push("");
      continue;
    }
    let remainder = segment;
    while (remainder.length > 0) {
      const { line, remainder: rest } = performLineBreak(remainder, options);
      result.push(line);
      if (!rest) break;
      remainder = rest;
    }
  }
  return result;
}
