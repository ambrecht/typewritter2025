import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import type { TypewriterState, TypewriterActions, Line, WrapMode } from "@/types"
import { calculateTextStatistics } from "@/utils/text-statistics"
import { saveText, getLastSession } from "@/utils/api"
import { measureTextWidth } from "@/utils/canvas-utils"

// Cache for grapheme widths (performance)
const graphemeWidthCache = new Map<string, number>()

const initialState: Omit<TypewriterState, "lastSaveStatus" | "isSaving" | "isLoading" | "containerWidth"> = {
  lines: [],
  activeLine: "",
  maxCharsPerLine: 56, // legacy only
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

  // wrapping config
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

      // --- CONFIG ---
      setWrapMode: (mode: WrapMode) => set({ wrapMode: mode }),
      setHyphenChar: (c: string) => set({ hyphenChar: c || "-" }),
      setUserMaxCols: (n: number) => {
        const maxAuto = get().maxAutoCols
        const clamped = Math.max(1, Math.min(n ?? maxAuto, maxAuto))
        set({ maxUserCols: clamped })
      },
      setTextMetrics: ({ avgGraphemeWidth, maxAutoCols }: { avgGraphemeWidth: number; maxAutoCols: number }) => {
        const clampedAuto = Math.max(1, Math.floor(maxAutoCols))
        let user = get().maxUserCols
        if (user && user > clampedAuto) user = clampedAuto
        set({
          avgGraphemeWidth: Math.max(1, avgGraphemeWidth),
          maxAutoCols: clampedAuto,
          maxUserCols: user,
        })
      },

      toggleFlowMode: () => set((s) => ({ flowMode: !s.flowMode })),

      // Internal: commit exactly one history line and continue seamlessly in ACL
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

      // Grapheme-aware, pixel-measured input handling with two wrap modes
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

        // Effective pixel limit derived from columns and content width
        const effectiveCols = Math.min(maxAutoCols, maxUserCols ?? maxAutoCols)
        const font = `${fontSize}px "Lora", serif`
        const hyphenWidth = measureTextWidth(hyphenChar, font)
        const pixelLimitFromCols = effectiveCols * Math.max(1, avgGraphemeWidth)
        const pixelLimit = Math.min(containerWidth, pixelLimitFromCols)

        // Fast path: fits entirely
        if (measureTextWidth(next, font) <= pixelLimit) {
          set({
            activeLine: next,
            statistics: calculateTextStatistics([...lines.map((l) => l.text), next].join("\n")),
          })
          return
        }

        // Overflow handling (grapheme-aware)
        const seg = new Intl.Segmenter("de", { granularity: "grapheme" })
        const nextSegs = Array.from(seg.segment(next))

        // Word-wrap mode: if ACL has content and overflow occurs with a new word, commit ACL and move word to next ACL
        if (wrapMode === "word-wrap") {
          // Look for last space before the just-typed overflow
          let lastSpaceIndex = -1
          for (let i = 0; i < nextSegs.length; i++) {
            if (nextSegs[i].segment === " ") lastSpaceIndex = i
          }
          const currentHasText = activeLine.trimEnd().length > 0
          if (currentHasText && lastSpaceIndex >= 0) {
            // Commit existing ACL (trimEnd), keep the word (without leading spaces) in ACL
            const committed = activeLine.trimEnd()
            const remainder = next.slice(activeLine.length).replace(/^\s+/, "")
            get()._commitLine(committed, remainder)
            return
          }
          // If ACL is empty (or we couldn't separate by space), fall through to hard split behavior
        }

        // Hard-hyphen behavior (or word-wrap fallback when ACL empty)
        const remainderStr = next.slice(activeLine.length)
        const remainderSeg = Array.from(seg.segment(remainderStr))
        const currentWidth = measureTextWidth(activeLine, font)
        const remainingWidth = Math.max(0, pixelLimit - currentWidth)

        // Try to take as many graphemes as possible and leave room for hyphen
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

        // No space fit and no room for hyphen segment: commit ACL as-is, move whole word to next line
        if (activeLine.trimEnd().length > 0) {
          get()._commitLine(activeLine.trimEnd(), next.slice(activeLine.length).replace(/^\s+/, ""))
          return
        }

        // ACL empty and long word: split to fit N-1 + hyphen at pixel limit
        let widthAcc = 0
        let countAcc = 0
        for (let i = 0; i < nextSegs.length; i++) {
          const g = nextSegs[i].segment
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
          nextSegs
            .slice(0, Math.max(0, countAcc))
            .map((s) => s.segment)
            .join("") + hyphenChar
        const tail = nextSegs
          .slice(Math.max(0, countAcc))
          .map((s) => s.segment)
          .join("")
        get()._commitLine(head.trimEnd(), tail.replace(/^\s+/, ""))
      },

      setContainerWidth: (width: number) => set({ containerWidth: width }),
      setOffset: (offset: number) => set({ offset }),
      setActiveLine: (text: string) => {
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
      updateLineBreakConfig: (config: Partial<TypewriterState["lineBreakConfig"]>) => {
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

      // Navigation offset windowing: only affects history viewport
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
