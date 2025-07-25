import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import type { TypewriterState, TypewriterActions } from "@/types"
import { calculateTextStatistics } from "@/utils/text-statistics"
import { saveText, getLastSession } from "@/utils/api"
import { measureTextWidth } from "@/utils/canvas-utils"

const debug = process.env.NODE_ENV !== "production"
const log = (...args: unknown[]) => debug && console.log("[TypewriterPad]", ...args)

const initialState: Omit<TypewriterState, "lastSaveStatus" | "isSaving" | "isLoading" | "containerWidth"> = {
  lines: [],
  activeLine: "",
  maxCharsPerLine: 56, // Dient nur noch als Fallback/Referenz
  statistics: { wordCount: 0, letterCount: 0, pageCount: 0 },
  lineBreakConfig: { maxCharsPerLine: 56, autoMaxChars: true },
  fontSize: 24,
  stackFontSize: 18,
  darkMode: false,
  mode: "typing",
  selectedLineIndex: null,
}

export const useTypewriterStore = create<TypewriterState & TypewriterActions>()(
  persist(
    (set, get) => ({
      ...initialState,
      containerWidth: 800, // Standardbreite
      lastSaveStatus: null,
      isSaving: false,
      isLoading: false,

      setContainerWidth: (width: number) => set({ containerWidth: width }),

      setActiveLine: (text) => {
        const t0 = performance.now()
        const { containerWidth, fontSize, lines } = get()
        const font = `${fontSize}px "IBM Plex Serif", Georgia, serif`
        // Entspricht p-6 in Tailwind (1.5rem * 2 = 24px * 2 = 48px)
        const availableWidth = containerWidth > 48 ? containerWidth - 48 : containerWidth

        const processLine = (
          currentText: string,
          currentLines: string[],
        ): { finalLines: string[]; finalActiveLine: string } => {
          const textWidth = measureTextWidth(currentText, font)
          const willWrap = textWidth > availableWidth

          log("input", { len: currentText.length, width: textWidth.toFixed(2), availableWidth, willWrap })

          if (!willWrap) {
            return { finalLines: currentLines, finalActiveLine: currentText }
          }

          // Text ist zu lang, finde Umbruchpunkt
          let breakPoint = -1
          // Finde das letzte Zeichen, das noch in die Zeile passt
          for (let i = currentText.length - 1; i >= 0; i--) {
            if (measureTextWidth(currentText.substring(0, i), font) <= availableWidth) {
              breakPoint = i
              break
            }
          }

          if (breakPoint <= 0) {
            // Kann nicht umgebrochen werden oder leere Zeile
            return { finalLines: currentLines, finalActiveLine: currentText }
          }

          const fittingText = currentText.substring(0, breakPoint)
          const lastSpaceIndex = fittingText.lastIndexOf(" ")

          let lineToAdd: string
          let remainder: string

          // Wenn ein Leerzeichen gefunden wird und es nicht am Anfang steht, führe einen Soft-Wrap durch
          if (lastSpaceIndex > 0) {
            lineToAdd = currentText.substring(0, lastSpaceIndex)
            remainder = currentText.substring(lastSpaceIndex + 1)
          } else {
            // Kein Leerzeichen im passenden Teil gefunden, führe einen Hard-Wrap durch
            lineToAdd = fittingText
            remainder = currentText.substring(breakPoint)
          }

          log("wrap", {
            pushed: lineToAdd,
            stackSize: currentLines.length + 1,
            remainder: remainder,
          })

          const newLines = [...currentLines, lineToAdd]
          // Verarbeite den Rest rekursiv, falls er ebenfalls zu lang ist
          return processLine(remainder, newLines)
        }

        const { finalLines, finalActiveLine } = processLine(text, lines)

        const newFullText = [...finalLines, finalActiveLine].join("\n")
        set({
          lines: finalLines,
          activeLine: finalActiveLine,
          statistics: calculateTextStatistics(newFullText),
        })

        if (debug) {
          log("setActiveLine Δms", Math.round(performance.now() - t0))
        }
      },

      addLineToStack: () => {
        const { activeLine, lines } = get()
        if (activeLine.trim() === "" && lines.length > 0 && lines[lines.length - 1].trim() === "") {
          return // Verhindere mehrere aufeinanderfolgende leere Zeilen
        }
        const newLines = [...lines, activeLine]
        const newText = newLines.join("\n")
        set({
          lines: newLines,
          activeLine: "",
          statistics: calculateTextStatistics(newText),
        })
      },

      updateLineBreakConfig: (config) => {
        const newConfig = { ...get().lineBreakConfig, ...config }
        set({
          lineBreakConfig: newConfig,
          maxCharsPerLine: newConfig.maxCharsPerLine,
        })
      },

      setFontSize: (size) => set({ fontSize: size }),
      setStackFontSize: (size) => set({ stackFontSize: size }),
      toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
      clearCurrentInput: () => set({ activeLine: "" }),
      clearAllLines: () => set({ lines: [], statistics: { wordCount: 0, letterCount: 0, pageCount: 0 } }),
      resetSession: () => set({ ...initialState, containerWidth: get().containerWidth }),

      setFixedLineLength: (length) => {
        get().updateLineBreakConfig({ maxCharsPerLine: length, autoMaxChars: false })
      },

      setMode: (mode) => set({ mode }),
      setSelectedLineIndex: (index) => set({ selectedLineIndex: index }),

      navigateUp: () => {
        const { lines, selectedLineIndex } = get()
        if (lines.length === 0) return
        const newIndex = selectedLineIndex === null ? lines.length - 1 : Math.max(0, selectedLineIndex - 1)
        set({ mode: "navigating", selectedLineIndex: newIndex })
      },

      navigateDown: () => {
        const { lines, selectedLineIndex } = get()
        if (selectedLineIndex === null || selectedLineIndex >= lines.length - 1) {
          get().resetNavigation()
        } else {
          set({ selectedLineIndex: selectedLineIndex + 1 })
        }
      },

      navigateForward: (count) => {
        const { lines, selectedLineIndex } = get()
        if (selectedLineIndex === null) return
        const newIndex = Math.min(lines.length - 1, selectedLineIndex + count)
        set({ selectedLineIndex: newIndex })
      },

      navigateBackward: (count) => {
        const { selectedLineIndex } = get()
        if (selectedLineIndex === null) return
        const newIndex = Math.max(0, selectedLineIndex - count)
        set({ selectedLineIndex: newIndex })
      },

      resetNavigation: () => {
        set({ mode: "typing", selectedLineIndex: null })
      },

      saveSession: async () => {
        const { lines, activeLine } = get()
        const fullText = [...lines, activeLine].join("\n")
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
            const newLines = result.text.split("\n")
            const newActiveLine = newLines.pop() || ""
            set({
              lines: newLines,
              activeLine: newActiveLine,
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
      partialize: (state) =>
        Object.fromEntries(
          Object.entries(state).filter(
            ([key]) => !["isSaving", "isLoading", "lastSaveStatus", "containerWidth"].includes(key),
          ),
        ),
    },
  ),
)
