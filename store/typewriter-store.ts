import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import type { TypewriterState, TypewriterActions, LineBreakConfig, Line } from "@/types"
import { calculateTextStatistics } from "@/utils/text-statistics"
import { saveText, getLastSession } from "@/utils/api"
import { measureTextWidth } from "@/utils/canvas-utils"

/**
 * @constant initialState
 * @description Der initiale Zustand der Typewriter-Anwendung.
 * Wird für den Start und beim Zurücksetzen der Sitzung verwendet.
 */
const initialState: Omit<
  TypewriterState,
  "lastSaveStatus" | "isSaving" | "isLoading" | "containerWidth"
> = {
  lines: [],
  activeLine: "",
  maxCharsPerLine: 56, // Dient als Referenz und Fallback
  statistics: { wordCount: 0, letterCount: 0, pageCount: 0 },
  lineBreakConfig: { maxCharsPerLine: 56, autoMaxChars: true },
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
  flowMode: false, // Neuer Zustand für den Flow Mode
}

/**
 * @function useTypewriterStore
 * @description Der zentrale Zustand-Store für die Typewriter-Anwendung, implementiert mit Zustand.
 * Verwaltet den gesamten Anwendungszustand, inklusive Aktionen zur Zustandsänderung und Persistenz im LocalStorage.
 *
 * @returns Ein Hook zur Verwendung des Stores in React-Komponenten.
 */
export const useTypewriterStore = create<TypewriterState & TypewriterActions>()(
  persist(
    (set, get) => ({
      // --- STATE PROPERTIES ---
      ...initialState,
      containerWidth: 800, // Standardbreite, wird bei UI-Mount aktualisiert
      lastSaveStatus: null,
      isSaving: false,
      isLoading: false,

      // --- ACTIONS ---

      /**
       * Schaltet den Flow Mode um. Im Flow Mode kann nicht gelöscht werden.
       */
      toggleFlowMode: () => set((state) => ({ flowMode: !state.flowMode })),

      /**
       * Verarbeitet einen Tastendruck. Dies ist die ZENTRALE Funktion für alle Eingaben.
       * Sie ersetzt die direkte Interaktion mit einem <textarea>-Element.
       * @param {string} key - Die von der Tastatur gedrückte Taste (z.B. "a", "Backspace", "Enter").
       */
      handleKeyPress: (key: string) => {
        const { flowMode, activeLine, lines, containerWidth, fontSize, lineBreakConfig } = get()

        // 1. Behandelt die "Enter"-Taste
        if (key === "Enter") {
          get().addLineToStack()
          return
        }

        // 2. Behandelt die "Backspace"-Taste
        if (key === "Backspace") {
          // Löschen ist im Flow Mode nicht erlaubt.
          if (flowMode) {
            return
          }

          // Das Löschen wirkt sich NUR auf die activeLine aus.
          // Wenn die activeLine leer ist, passiert nichts.
          if (activeLine.length > 0) {
            const newActiveLine = activeLine.slice(0, -1)
            set({
              activeLine: newActiveLine,
              statistics: calculateTextStatistics([
                ...lines.map((l) => l.text),
                newActiveLine,
              ].join("\n")),
            })
          }
          // Die fehlerhafte Logik, die Zeilen aus dem Stack zurückgeholt hat, wurde entfernt.
          return
        }

        // 3. Behandelt alle anderen (druckbaren) Zeichen
        // Ignoriere Funktionstasten wie "Shift", "Control", "ArrowLeft" etc.
        if (key.length === 1) {
          const newActiveLineContent = activeLine + key

          // Wenn der automatische Umbruch deaktiviert ist, einfach Text anhängen.
          if (!lineBreakConfig.autoMaxChars) {
            set({
              activeLine: newActiveLineContent,
              statistics: calculateTextStatistics([
                ...lines.map((l) => l.text),
                newActiveLineContent,
              ].join("\n")),
            })
            return
          }

          const font = `${fontSize}px "Lora", serif`
          // The containerWidth from the store is now the clientWidth of the text area,
          // which already accounts for padding. No subtraction needed.
          const availableWidth = containerWidth
          const textWidth = measureTextWidth(newActiveLineContent, font)

          if (textWidth <= availableWidth) {
            set({
              activeLine: newActiveLineContent,
              statistics: calculateTextStatistics([
                ...lines.map((l) => l.text),
                newActiveLineContent,
              ].join("\n")),
            })
          } else {
            // Der Text ist zu lang, führe einen Umbruch durch.
            const lastSpaceIndex = newActiveLineContent.lastIndexOf(" ")
            let lineToAdd: string
            let remainder: string

            if (lastSpaceIndex > 0) {
              // Weicher Umbruch am letzten Leerzeichen
              lineToAdd = newActiveLineContent.substring(0, lastSpaceIndex)
              remainder = newActiveLineContent.substring(lastSpaceIndex + 1)
            } else {
              // Harter Umbruch, wenn kein Leerzeichen gefunden wurde
              lineToAdd = newActiveLineContent
              remainder = ""
            }

            const newLines: Line[] = [
              ...lines,
              { id: crypto.randomUUID(), text: lineToAdd },
            ]
            set({
              lines: newLines,
              activeLine: remainder,
              offset: 0,
              mode: "write",
              selectedLineIndex: null,
              statistics: calculateTextStatistics([
                ...newLines.map((l) => l.text),
                remainder,
              ].join("\n")),
            })
          }
        }
      },

      /**
       * Aktualisiert die Breite des Schreib-Containers.
       * Wichtig für die Berechnung des automatischen Zeilenumbruchs.
       * @param {number} width - Die neue Breite des Containers in Pixeln.
      */
      setContainerWidth: (width: number) => set({ containerWidth: width }),

      /**
       * Setzt den Offset für die Sichtbarkeit des Zeilenstacks.
       * @param {number} offset - Der neue Offset-Wert.
       */
      setOffset: (offset: number) => set({ offset }),

      /**
       * Setzt den Text der aktiven Zeile und führt bei Bedarf einen automatischen Zeilenumbruch durch.
       * Dies ist die Kernlogik für das "fließende" Schreiben.
       * @param {string} text - Der neue Text aus dem Eingabefeld.
       */
      setActiveLine: (text) => {
        const newFullText = [...get().lines.map((l) => l.text), text].join("\n")
        set({
          activeLine: text,
          statistics: calculateTextStatistics(newFullText),
        })
      },

      /**
       * Fügt die aktuelle `activeLine` zum `lines`-Array hinzu und leert die `activeLine`.
       * Wird bei "Enter" oder beim automatischen Umbruch aufgerufen.
       */
      addLineToStack: () => {
        const { activeLine, lines } = get()
        // Verhindere das Hinzufügen mehrerer aufeinanderfolgender leerer Zeilen.
        if (
          activeLine.trim() === "" &&
          lines.length > 0 &&
          lines[lines.length - 1].text.trim() === ""
        ) {
          return
        }
        const newLines: Line[] = [
          ...lines,
          { id: crypto.randomUUID(), text: activeLine },
        ]
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

      /**
       * Aktualisiert die Konfiguration für den Zeilenumbruch.
       * @param {Partial<LineBreakConfig>} config - Ein Objekt mit den zu aktualisierenden Konfigurationswerten.
       */
      updateLineBreakConfig: (config: Partial<LineBreakConfig>) => {
        const newConfig = { ...get().lineBreakConfig, ...config }
        set({
          lineBreakConfig: newConfig,
          maxCharsPerLine: newConfig.maxCharsPerLine,
        })
      },

      /**
       * Setzt die Schriftgröße für die aktive Zeile.
       * @param {number} size - Die neue Schriftgröße in Pixeln.
       */
      setFontSize: (size: number) => set({ fontSize: size }),

      /**
       * Setzt die Schriftgröße für den Zeilenstack.
       * @param {number} size - Die neue Schriftgröße in Pixeln.
       */
      setStackFontSize: (size: number) => set({ stackFontSize: size }),

      /**
       * Schaltet den Dark Mode um.
       */
      toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),

      /**
       * Leert nur die aktuelle Eingabezeile.
       */
      clearCurrentInput: () => set({ activeLine: "" }),

      /**
       * Leert den gesamten Text (Zeilenstack und aktive Zeile).
       */
      clearAllLines: () =>
        set({
          lines: [],
          activeLine: "",
          offset: 0,
          statistics: { wordCount: 0, letterCount: 0, pageCount: 0 },
        }),

      /**
       * Setzt die gesamte Sitzung auf den initialen Zustand zurück.
       */
      resetSession: () => {
        set({ ...initialState, containerWidth: get().containerWidth })
      },

      /**
       * Setzt eine feste Zeilenlänge und deaktiviert den automatischen Umbruch.
       * @param {number} length - Die feste Anzahl an Zeichen pro Zeile.
       */
      setFixedLineLength: (length: number) => {
        get().updateLineBreakConfig({ maxCharsPerLine: length, autoMaxChars: false })
      },

      /**
       * Setzt den Anwendungsmodus ('write' oder 'nav').
       * @param {"write" | "nav"} mode - Der neue Modus.
      */
      setMode: (mode) => set({ mode }),

      /**
       * Setzt den Index der ausgewählten Zeile im Navigationsmodus.
       * @param {number | null} index - Der Index der Zeile oder `null`.
      */
      setSelectedLineIndex: (index) => set({ selectedLineIndex: index }),

      /**
       * Aktualisiert die maximale Anzahl sichtbarer Zeilen.
       */
      setMaxVisibleLines: (count: number) => set({ maxVisibleLines: count }),

      /**
       * Passt den Zeilenversatz an.
       */
      adjustOffset: (delta: number) => {
        const { offset, lines, activeLine, maxVisibleLines } = get()
        const allLines = [...lines, activeLine]
        const maxOffset = Math.max(allLines.length - maxVisibleLines, 0)
        const newOffset = Math.min(Math.max(offset + delta, 0), maxOffset)
        set({ offset: newOffset })
      },

      /**
       * Navigiert eine Zeile nach oben im Stack.
       */
      navigateUp: () => {
        set({ mode: "nav" })
        get().adjustOffset(1)
      },

      /**
       * Navigiert eine Zeile nach unten im Stack oder beendet den Navigationsmodus.
       */
      navigateDown: () => {
        set({ mode: "nav" })
        get().adjustOffset(-1)
      },

        /**
         * Beendet den Navigationsmodus und kehrt zum Schreibmodus zurück.
         */
        resetNavigation: () => {
          set({ mode: "write", selectedLineIndex: null, offset: 0 })
      },

      /**
       * Speichert die aktuelle Sitzung über die API.
       */
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

      /**
       * Lädt die letzte gespeicherte Sitzung von der API.
       */
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
      // Konfiguration für die Persistenz-Middleware
      name: "typewriter-storage", // Eindeutiger Name für den LocalStorage-Key
      storage: createJSONStorage(() => localStorage), // Verwende LocalStorage
      /**
       * Wird nach dem Laden des Zustands aus dem Storage ausgeführt.
       * Ermöglicht die Migration von alten Datenformaten.
       */
      onRehydrateStorage: () => (state) => {
        if (state) {
          if (state.lines && state.lines.length > 0) {
            if (typeof state.lines[0] === "string") {
              state.lines = (state.lines as unknown as string[]).map((text) => ({
                id: crypto.randomUUID(),
                text,
              }))
            } else if (
              typeof state.lines[0] === "object" &&
              state.lines[0] !== null
            ) {
              state.lines = (state.lines as any[]).map((line) => ({
                id:
                  typeof line.id === "string"
                    ? line.id
                    : typeof line.id === "number"
                      ? String(line.id)
                      : crypto.randomUUID(),
                text: typeof line.text === "string" ? line.text : "",
              }))
            }
          }
          // Stelle sicher, dass flowMode nach dem Laden existiert
          if (typeof state.flowMode === "undefined") {
            state.flowMode = false
          }
          if (typeof state.offset === "undefined") {
            state.offset = 0
          }
        }
      },
      /**
       * Definiert, welche Teile des Zustands im LocalStorage gespeichert werden sollen.
       * Flüchtige Zustände wie `isSaving` oder `isLoading` werden ausgeschlossen.
       */
      partialize: (state) =>
        Object.fromEntries(
          Object.entries(state).filter(
            ([key]) => !["isSaving", "isLoading", "lastSaveStatus", "containerWidth"].includes(key),
          ),
        ),
    },
  ),
)
