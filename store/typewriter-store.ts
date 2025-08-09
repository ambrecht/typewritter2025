import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import type { TypewriterState, TypewriterActions, Line } from "@/types"
import { calculateTextStatistics } from "@/utils/text-statistics"
import { saveText, getLastSession } from "@/utils/api"
import { measureTextWidth } from "@/utils/canvas-utils"

// Grapheme width cache
const graphemeWidthCache = new Map<string, number>()

const initialState: Omit<TypewriterState, "lastSaveStatus" | "isSaving" | "isLoading" | "containerWidth"> = {
  lines: [],
  activeLine: "",
  maxCharsPerLine: 56, // legacy display only
  statistics: { wordCount: 0, letterCount: 0, pageCount: 0 },
  lineBreakConfig: { maxCharsPerLine: 56, autoMaxChars: true }, // legacy
  fontSize: 24,
  stackFontSize: 18,
  darkMode: false,
  paragraphRanges: [],
  inParagraph: false,
  currentParagraphStart: 0,
  mode: "write",
  selectedLineIndex: null,
  offset: 0,
  maxVisibleLines: 0,
  flowMode: false,

  // New wrap configuration
  wrapMode: "word-wrap",
  hyphenChar: "-",
  maxUserCols: undefined,
  maxAutoCols: 80,
  avgGraphemeWidth: 10,
}

export const useTypewriterStore = create<TypewriterState & TypewriterActions>()(
  persist(
    (set, get) => ({
      ...initialState,
      containerWidth: 800,
      lastSaveStatus: null,
      isSaving: false,
      isLoading: false,

      // --- CONFIG ACTIONS ---
      setWrapMode: (mode) => set({ wrapMode: mode }),
      setHyphenChar: (c) => set({ hyphenChar: c || "-" }),
      setUserMaxCols: (n) => {
        const maxAuto = get().maxAutoCols
        const clamped = Math.max(1, Math.min(n ?? maxAuto, maxAuto))
        set({ maxUserCols: clamped })
      },
      setTextMetrics: ({ avgGraphemeWidth, maxAutoCols }) => {
        const clampedAuto = Math.max(1, Math.floor(maxAutoCols))
        let user = get().maxUserCols
        if (user && user > clampedAuto) user = clampedAuto
        set({ avgGraphemeWidth: Math.max(1, avgGraphemeWidth), maxAutoCols: clampedAuto, maxUserCols: user })
      },

      toggleFlowMode: () => set((s) => ({ flowMode: !s.flowMode })),

      // Helper: commit a line to history and recalc stats
      _commitLine: (lineText: string, remainder: string) => {
        const newLines: Line[] = [...get().lines, { id: crypto.randomUUID(), text: lineText.trimEnd() }]
        const joined = [...newLines.map((l) => l.text), remainder].join("\n")
        set({
          lines: newLines,
          activeLine: remainder,
          offset: 0,
          mode: "write",
          selectedLineIndex: null,
          statistics: calculateTextStatistics(joined),
        })
      },

      handleKeyPress: (key: string) => {
        const state = get()
        const {
          flowMode,
          activeLine,
          lines,
          containerWidth,
          fontSize,
          wrapMode,
          hyphenChar,
          maxUserCols,
          maxAutoCols,
          avgGraphemeWidth,
        } = state

        if (key === "Enter") {
          if (activeLine.length === 0 && lines.length > 0 && lines[lines.length - 1].text.trim() === "") {
            // prevent double empty lines
            return
          }
          get()._commitLine(activeLine, "")
          return
        }

        if (key === "Backspace") {
          if (flowMode) return
          if (activeLine.length > 0) {
            const newActive = activeLine.slice(0, -1)
            set({
              activeLine: newActive,
              statistics: calculateTextStatistics([...lines.map((l) => l.text), newActive].join("\n")),
            })
          }
          return
        }

        if (key.length !== 1) return

        const next = activeLine + key

        // Effective pixel limit from columns:
        const effectiveCols = Math.min(maxAutoCols, maxUserCols ?? maxAutoCols)
        const hyphenWidth = measureTextWidth(hyphenChar, `${fontSize}px "Lora", serif`)
        const pixelLimitFromCols = effectiveCols * Math.max(1, avgGraphemeWidth)
        const pixelLimit = Math.min(containerWidth, pixelLimitFromCols)

        const font = `${fontSize}px "Lora", serif`

        // Quick path: does next fully fit in pixel limit?
        const nextWidth = measureTextWidth(next, font)
        if (nextWidth <= pixelLimit) {
          set({
            activeLine: next,
            statistics: calculateTextStatistics([...lines.map((l) => l.text), next].join("\n")),
          })
          return
        }

        // Overflow handling: grapheme-aware
        const seg = new Intl.Segmenter("de", { granularity: "grapheme" })
        const segments = Array.from(seg.segment(next))
        // Find last space position (grapheme index)
        let lastSpaceIndex = -1
        for (let i = 0; i < segments.length; i++) {
          if (segments[i].segment === " ") lastSpaceIndex = i
        }

        const currentWidth = measureTextWidth(activeLine, font)
        const remainingWidth = Math.max(0, pixelLimit - currentWidth)

        // Word-Wrap: if we have a space in the current (before the new word), commit up to that space
        if (wrapMode === "word-wrap" && lastSpaceIndex >= 0) {
          const lastSpacePosInStr = lastSpaceIndex // segments indices map to grapheme positions
          // Compute committed = substring up to lastSpaceIndex (exclude space)
          const committed = segments
            .slice(0, lastSpacePosInStr)
            .map((s) => s.segment)
            .join("")
            .trimEnd()
          const remainder = segments
            .slice(lastSpacePosInStr + 1)
            .map((s) => s.segment)
            .join("")
            .replace(/^\s+/, "")
          get()._commitLine(committed, remainder)
          return
        }

        // Word-Wrap: at line start and long word -> fallback to hard hyphen
        // or Hard-Hyphen mode
        // Determine how many graphemes of the remainder (beyond activeLine) can fit considering hyphen
        const remainderStr = next.slice(activeLine.length)
        const remainderSeg = Array.from(seg.segment(remainderStr))

        if (remainingWidth > hyphenWidth + 1) {
          let consumedWidth = 0
          let consumedCount = 0
          for (let i = 0; i < remainderSeg.length; i++) {
            const g = remainderSeg[i].segment
            const cacheKey = `${font}::${g}`
            let w = graphemeWidthCache.get(cacheKey)
            if (w === undefined) {
              w = measureTextWidth(g, font)
              graphemeWidthCache.set(cacheKey, w)
            }
            if (consumedWidth + w > remainingWidth - hyphenWidth) break
            consumedWidth += w
            consumedCount++
          }

          if (consumedCount > 0) {
            const consumedText = remainderSeg
              .slice(0, consumedCount)
              .map((s) => s.segment)
              .join("")
            const rest = remainderSeg
              .slice(consumedCount)
              .map((s) => s.segment)
              .join("")
            const committed = (activeLine + consumedText + hyphenChar).trimEnd()
            get()._commitLine(committed, rest.replace(/^\s+/, ""))
            return
          }
        }

        // No space and no room for hyphen segment: commit current line as-is; move the word to next line
        if (activeLine.trimEnd().length > 0) {
          get()._commitLine(activeLine.trimEnd(), next.slice(activeLine.length).replace(/^\s+/, ""))
          return
        }

        // At line start and word longer than limit: split hard to N-1 + hyphen
        // Determine max graphemes that fit in (pixelLimit - hyphenWidth)
        let widthAcc = 0
        let countAcc = 0
        for (let i = 0; i < segments.length; i++) {
          const g = segments[i].segment
          const cacheKey = `${font}::${g}`
          let w = graphemeWidthCache.get(cacheKey)
          if (w === undefined) {
            w = measureTextWidth(g, font)
            graphemeWidthCache.set(cacheKey, w)
          }
          if (widthAcc + w > pixelLimit - hyphenWidth) break
          widthAcc += w
          countAcc++
        }
        const head =
          segments
            .slice(0, Math.max(0, countAcc))
            .map((s) => s.segment)
            .join("") + hyphenChar
        const tail = segments
          .slice(Math.max(0, countAcc))
          .map((s) => s.segment)
          .join("")
        get()._commitLine(head.trimEnd(), tail.replace(/^\s+/, ""))
      },

      setContainerWidth: (width: number) => set({ containerWidth: width }),
      setOffset: (offset: number) => set({ offset }),
      setActiveLine: (text) => {
        const newFullText = [...get().lines.map((l) => l.text), text].join("\n")
        set({ activeLine: text, statistics: calculateTextStatistics(newFullText) })
      },
      addLineToStack: () => {
        const { activeLine, lines } = get()
        if (activeLine.trim() === "" && lines.length > 0 && lines[lines.length - 1].text.trim() === "") {
          return
        }
        const newLines: Line[] = [...lines, { id: crypto.randomUUID(), text: activeLine }]
        const newText = newLines.map((l) => l.text).join("\n")
        set({
          lines: newLines,
          activeLine: "",
          offset: 0,
          mode: "write",
          selectedLineIndex: null,
          statistics: calculateTextStatistics(newText),
        })
      },
      updateLineBreakConfig: (config) => {
        const newConfig = { ...get().lineBreakConfig, ...config }
        set({ lineBreakConfig: newConfig, maxCharsPerLine: newConfig.maxCharsPerLine })
      },
      setFontSize: (size: number) => set({ fontSize: size }),
      setStackFontSize: (size: number) => set({ stackFontSize: size }),
      toggleDarkMode: () => set((s) => ({ darkMode: !s.darkMode })),
      clearCurrentInput: () => set({ activeLine: "" }),
      clearAllLines: () =>
        set({
          lines: [],
          activeLine: "",
          offset: 0,
          statistics: { wordCount: 0, letterCount: 0, pageCount: 0 },
        }),
      resetSession: () => set({ ...initialState, containerWidth: get().containerWidth }),
      setFixedLineLength: (length: number) => {
        get().updateLineBreakConfig({ maxCharsPerLine: length, autoMaxChars: false })
      },
      setMode: (mode) => set({ mode }),
      setSelectedLineIndex: (index) => set({ selectedLineIndex: index }),
      setMaxVisibleLines: (count: number) => set({ maxVisibleLines: count }),

      adjustOffset: (delta: number) => {
        const { offset, lines, maxVisibleLines } = get()
        const maxOffset = Math.max(lines.length - maxVisibleLines, 0)
        const newOffset = Math.min(Math.max(offset + delta, 0), maxOffset)
        set({ offset: newOffset })
      },

      navigateUp: () => {
        set({ mode: "nav" })
        get().adjustOffset(1)
      },
      navigateDown: () => {
        set({ mode: "nav" })
        get().adjustOffset(-1)
      },
      resetNavigation: () => {
        set({ mode: "write", selectedLineIndex: null, offset: 0 })
      },

      saveSession: async () => {
        const { lines, activeLine } = get()
        const fullText = [...lines.map((l) => l.text), activeLine].join("\n")
        set({ isSaving: true, lastSaveStatus: null })
        try {
          const result = await saveText(fullText)
          set({ lastSaveStatus: result })
        } catch (error) {
          set({
            lastSaveStatus: {
              success: false,
              message: error instanceof Error ? error.message : "Unbekannter Fehler",
            },
          })
        } finally {
          set({ isSaving: false })
        }
      },

      loadLastSession: async () => {
        set({ isLoading: true, lastSaveStatus: null })
        try {
          const result = await getLastSession()
          if (result.success && typeof result.text === "string") {
            const newLinesStrings = result.text.split("\n")
            const newActiveLine = newLinesStrings.pop() || ""
            const lineObjects: Line[] = newLinesStrings.map((text) => ({
              id: crypto.randomUUID(),
              text,
            }))
            set({
              lines: lineObjects,
              activeLine: newActiveLine,
              offset: 0,
              statistics: calculateTextStatistics(result.text),
              lastSaveStatus: { success: true, message: "Erfolgreich geladen" },
            })
          } else {
            set({ lastSaveStatus: { success: false, message: result.message || "Laden fehlgeschlagen" } })
          }
        } catch (error) {
          set({
            lastSaveStatus: {
              success: false,
              message: error instanceof Error ? error.message : "Unbekannter Fehler",
            },
          })
        } finally {
          set({ isLoading: false })
        }
      },
    }),
    {
      name: "typewriter-storage",
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          if (state.lines && (state.lines as any[]).length > 0) {
            const arr = state.lines as any[]
            state.lines = arr.map((line: any) => ({
              id: typeof line.id === "string" ? line.id : crypto.randomUUID(),
              text: typeof line.text === "string" ? line.text : "",
            }))
          }
          if (typeof (state as any).flowMode === "undefined") (state as any).flowMode = false
          if (typeof (state as any).offset === "undefined") (state as any).offset = 0
        }
      },
      partialize: (state) =>
        Object.fromEntries(
          Object.entries(state).filter(
            ([key]) => !["isSaving", "isLoading", "lastSaveStatus", "containerWidth"].includes(key),
          ),
        ),
    },
  ),
)
