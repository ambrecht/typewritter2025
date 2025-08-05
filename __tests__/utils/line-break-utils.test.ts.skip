import { calculateOptimalLineLength, performLineBreak, breakTextIntoLines } from "@/utils/line-break-utils"

describe("Line Break Utils", () => {
  describe("calculateOptimalLineLength", () => {
    it("should calculate optimal line length for desktop", () => {
      const result = calculateOptimalLineLength(800, 24)
      expect(result).toBeGreaterThan(20)
      expect(result).toBeLessThan(200)
    })

    it("should handle edge cases", () => {
      expect(calculateOptimalLineLength(0, 24)).toBeGreaterThan(20)
      expect(calculateOptimalLineLength(800, 0)).toBeGreaterThan(20)
    })
  })

  describe("performLineBreak", () => {
    it("should not break short text", () => {
      const result = performLineBreak("Short text", { maxCharsPerLine: 50, autoMaxChars: false })
      expect(result.line).toBe("Short text")
      expect(result.remainder).toBe("")
    })

    it("should break at word boundaries", () => {
      const text = "This is a very long line that should be broken at word boundaries"
      const result = performLineBreak(text, { maxCharsPerLine: 30, autoMaxChars: false })

      expect(result.line.length).toBeLessThanOrEqual(30)
      expect(result.remainder.length).toBeGreaterThan(0)
      expect(result.line + " " + result.remainder).toBe(text)
    })

    it("should break at max chars if no word boundary found", () => {
      const text = "Thisisaverylongwordwithoutspaces"
      const result = performLineBreak(text, { maxCharsPerLine: 20, autoMaxChars: false })

      expect(result.line.length).toBe(20)
      expect(result.remainder).toBe(text.substring(20))
    })
  })

  describe("breakTextIntoLines", () => {
    it("should respect existing line breaks", () => {
      const text = "Line 1\nLine 2\nLine 3"
      const result = breakTextIntoLines(text, { maxCharsPerLine: 50, autoMaxChars: false })

      expect(result).toEqual(["Line 1", "Line 2", "Line 3"])
    })

    it("should break long text into multiple lines", () => {
      const text = "This is a very long text that should be broken into multiple lines based on the character limit"
      const result = breakTextIntoLines(text, { maxCharsPerLine: 30, autoMaxChars: false })

      expect(result.length).toBeGreaterThan(1)
      result.forEach((line) => {
        expect(line.length).toBeLessThanOrEqual(30)
      })
    })
  })
})
