import { create } from "zustand"
import { persist } from "zustand/middleware"
import { MarkdownType }
  from "@/types"
import type {
  LineBreakConfig,
  FormattedLine,
  ParagraphRange,
  TextStatistics,
  FlowModeConfig,
} from "@/types"
import { calculateTextStatistics } from "@/utils/text-statistics"
import { saveText, getLastSession } from "@/utils/api"
import { parseMarkdownLine } from "@/utils/markdown-parser"

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
  currentParagraphStart: -1,
  activeLineType: MarkdownType.NORMAL,
  flowMode: DEFAULT_FLOW_MODE,
  soundEnabled: false,
  soundVolume: 0.5,
  soundsLoaded: false,
  loadProgress: 0,
  loadError: null,

  // Neue Zustandsvariablen
  mode: "typing",
  selectedLineIndex: null,
  offset: 0,
  maxVisibleLines: 0,
  flowMode: false, // Neuer Zustand für den Flow Mode
  offset: 0,
}

let nextLineId = 1

/**
 * @function useTypewriterStore
 * @description Der zentrale Zustand-Store für die Typewriter-Anwendung, implementiert mit Zustand.
 * Verwaltet den gesamten Anwendungszustand, inklusive Aktionen zur Zustandsänderung und Persistenz im LocalStorage.
 *
 * @returns Ein Hook zur Verwendung des Stores in React-Komponenten.
 */
const processParagraphMarkers = (
  state: TypewriterState,
  newLines: FormattedLine[],
  lineIndex: number,
): {
  inParagraph: boolean
  currentParagraphStart: number
  paragraphRanges: ParagraphRange[]
} => {
  let inParagraph = state.inParagraph
  let currentParagraphStart = state.currentParagraphStart
  const paragraphRanges = [...state.paragraphRanges]

  // Prüfe auf Absatzmarkierungen
  const line = state.activeLine

  // Wenn die Zeile genau *** ist, schalte den Absatzzustand um
  if (line.trim() === "***") {
    if (!inParagraph) {
      // Starte einen neuen Absatz
      inParagraph = true
      currentParagraphStart = lineIndex
    } else {
      // Beende einen Absatz
      inParagraph = false

      // Füge den Absatzbereich hinzu
      if (currentParagraphStart >= 0) {
        paragraphRanges.push({
          start: currentParagraphStart,
          end: lineIndex - 1, // Ende ist die vorherige Zeile, nicht die Markierung
        })
        currentParagraphStart = -1
      }
    }
    return { inParagraph, currentParagraphStart, paragraphRanges }
  }

  // Wenn die Zeile mit *** beginnt und endet, ist es ein Absatz
  if (line.trim().startsWith("***") && line.trim().endsWith("***") && line.trim().length > 6) {
    // Füge einen einzelnen Absatz hinzu
    paragraphRanges.push({
      start: lineIndex,
      end: lineIndex,
    })
    return { inParagraph, currentParagraphStart, paragraphRanges }
  }

  return { inParagraph, currentParagraphStart, paragraphRanges }
}

export interface TypewriterActions {
  setActiveLine: (text: string) => void
  addLineToStack: () => void
  updateLineBreakConfig: (config: Partial<LineBreakConfig>) => void
  setFontSize: (size: number) => void
  setStackFontSize: (size: number) => void
  setFixedLineLength: (length: number) => void
  toggleDarkMode: () => void
  clearCurrentInput: () => void
  clearAllLines: () => void
  resetSession: () => void
  saveSession: () => Promise<void>
  updateFlowMode: (config: Partial<FlowModeConfig>) => void
  startFlowMode: (timerType: "time" | "words", target: number) => void
  stopFlowMode: () => void
}

export interface TypewriterState {
  lines: FormattedLine[]
  activeLine: string
  maxCharsPerLine: number
  statistics: TextStatistics
  lineBreakConfig: LineBreakConfig
  fontSize: number
  stackFontSize: number
  darkMode: boolean
  paragraphRanges: ParagraphRange[]
  inParagraph: boolean
  currentParagraphStart: number
  activeLineType: MarkdownType
  flowMode: FlowModeConfig
  // Sound Einstellungen
  soundEnabled: boolean
  soundVolume: number
  soundsLoaded: boolean
  loadProgress: number
  loadError: string | null
}

// Füge die Sound-Aktionen zum Store hinzu
type TypewriterStore = TypewriterState &
  TypewriterActions & {
    mode: "typing" | "navigating"
    selectedLineIndex: number | null
    isSaving: boolean
    isLoading: boolean
    lastSaveStatus: { success: boolean; message: string; timestamp: number } | null
    setMode: (mode: "typing" | "navigating") => void
    setSelectedLineIndex: (index: number | null) => void
    navigateUp: () => void
    navigateDown: () => void
    navigateForward: (steps?: number) => void
    navigateBackward: (steps?: number) => void
    resetNavigation: () => void
    saveSession: () => Promise<void>
    loadLastSession: () => Promise<void>
    toggleSoundEnabled: () => void
    setSoundVolume: (value: number) => void
    playTypewriterClick: () => void
  }

export const useTypewriterStore = create<TypewriterStore>()(
  persist<TypewriterStore>(
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

          // Berechne Statistiken basierend auf dem gesamten Text
          const statistics = computeTextStatistics(state.lines, processedText)
          const { type } = parseMarkdownLine(processedText)

          // Wenn wir im Navigationsmodus sind, wechseln wir zurück zum Schreibmodus
          if (state.mode === "navigating") {
            return {
              activeLine: processedText,
              activeLineType: type,
              statistics,
              mode: "typing",
              selectedLineIndex: null,
            }
          }

          return {
            activeLine: processedText,
            activeLineType: type,
            statistics,
          }
          // Die fehlerhafte Logik, die Zeilen aus dem Stack zurückgeholt hat, wurde entfernt.
          return
        }

        // 3. Behandelt alle anderen (druckbaren) Zeichen
        // Ignoriere Funktionstasten wie "Shift", "Control", "ArrowLeft" etc.
        if (key.length === 1) {
          const newActiveLineContent = activeLine + key

          if (lines.length > 1) {
            // Verarbeite mehrere Zeilen als einfache Textzeilen
            const formattedLines = lines.map((line) => parseMarkdownLine(line))
            const newLines = [...state.lines, ...formattedLines]

          const font = `${fontSize}px "Lora", serif`
          // The containerWidth from the store is now the clientWidth of the text area,
          // which already accounts for padding. No subtraction needed.
          const availableWidth = containerWidth
          const textWidth = measureTextWidth(newActiveLineContent, font)

            return {
              lines: newLines,
              activeLine: "",
              activeLineType: MarkdownType.NORMAL,
              ...paragraphInfo,
            }
          } else {
            // Erstelle eine einfache Textzeile
            const formattedLine = parseMarkdownLine(state.activeLine)

            // Füge die formatierte Zeile zum Stack hinzu
            const newLines = [...state.lines, formattedLine]
            const lineIndex = newLines.length - 1

            // Verarbeite Absatzmarkierungen
            const paragraphInfo = processParagraphMarkers(state, newLines, lineIndex)

            const newLines: Line[] = [
              ...lines,
              { id: nextLineId++, text: lineToAdd },
            ]
            set({
              lines: newLines,
              activeLine: "",
              activeLineType: MarkdownType.NORMAL,
              ...paragraphInfo,
            }
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
          { id: nextLineId++, text: activeLine },
        ]
        const newText = newLines.map((l) => l.text).join("\n")
        set({
          lines: newLines,
          activeLine: "",
          offset: 0,
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
        nextLineId = 1
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
       * Setzt den Anwendungsmodus ('typing' oder 'navigating').
       * @param {"typing" | "navigating"} mode - Der neue Modus.
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
        set({ mode: "navigating", offset: newOffset })
      },

      /**
       * Navigiert eine Zeile nach oben im Stack.
       */
      navigateUp: () => get().adjustOffset(-1),

      /**
       * Navigiert eine Zeile nach unten im Stack oder beendet den Navigationsmodus.
       */
      navigateDown: () => get().adjustOffset(1),

      /**
       * Springt mehrere Zeilen vorwärts.
       * @param {number} count - Die Anzahl der zu springenden Zeilen.
       */
      navigateForward: (count: number) => {
        const { lines, selectedLineIndex } = get()
        if (selectedLineIndex === null) return
        const newIndex = Math.min(lines.length - 1, selectedLineIndex + count)
        set({ selectedLineIndex: newIndex })
      },

      /**
       * Springt mehrere Zeilen rückwärts.
       * @param {number} count - Die Anzahl der zu springenden Zeilen.
       */
      navigateBackward: (count: number) => {
        const { selectedLineIndex } = get()
        if (selectedLineIndex === null) return
        const newIndex = Math.max(0, selectedLineIndex - count)
        set({ selectedLineIndex: newIndex })
      },

      /**
       * Beendet den Navigationsmodus und kehrt zum Schreibmodus zurück.
       */
      resetNavigation: () => {
        set({ mode: "typing", selectedLineIndex: null, offset: 0 })
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

          if (result.success && result.text) {
            // Teile den Text in Zeilen auf und entferne leere Zeilen am Ende
            const textLines = result.text.split("\n")

            // Verarbeite die Zeilen als einfache Textzeilen
            const formattedLines = textLines.map((line) => ({
              text: line,
              type: MarkdownType.NORMAL,
            }))

            // Berechne Absatzbereiche neu
            const paragraphRanges: ParagraphRange[] = []
            let inParagraph = false
            let currentParagraphStart = -1

            // Durchlaufe alle Zeilen und identifiziere Absätze
            formattedLines.forEach((line, index) => {
              if (line.text.trim() === "***") {
                // Absatzmarker
                if (!inParagraph) {
                  // Starte einen neuen Absatz
                  inParagraph = true
                  currentParagraphStart = index + 1 // Der Absatz beginnt nach dem Marker
                } else {
                  // Beende einen Absatz
                  if (currentParagraphStart >= 0 && index > currentParagraphStart) {
                    paragraphRanges.push({
                      start: currentParagraphStart,
                      end: index - 1, // Ende ist die Zeile vor dem Marker
                    })
                  }
                  inParagraph = false
                  currentParagraphStart = -1
                }
              }
            })

            // Wenn wir am Ende noch in einem Absatz sind, füge ihn hinzu
            if (inParagraph && currentParagraphStart >= 0) {
              paragraphRanges.push({
                start: currentParagraphStart,
                end: formattedLines.length - 1,
              })
            }

            // Setze den neuen Zustand
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
              state.lines = (state.lines as string[]).map((text) => ({
                id: nextLineId++,
                text,
              }))
            } else if (
              typeof state.lines[0] === "object" &&
              state.lines[0] !== null
            ) {
              state.lines = (state.lines as any[]).map((line) => ({
                id: typeof line.id === "number" ? line.id : nextLineId++,
                text: typeof line.text === "string" ? line.text : "",
              }))
            }
            const maxId = (state.lines as Line[]).reduce(
              (max, line) => Math.max(max, line.id),
              0,
            )
            nextLineId = maxId + 1
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
      stopFlowMode: () =>
        set((state) => ({
          flowMode: {
            ...state.flowMode,
            enabled: false,
            timerStartTime: undefined,
            initialWordCount: undefined,
          },
        })),

      // Platzhalterfunktionen für Soundeinstellungen
      toggleSoundEnabled: () => set((state) => ({ soundEnabled: !state.soundEnabled })),
      setSoundVolume: (value: number) => set(() => ({ soundVolume: value })),
      playTypewriterClick: () => {
        /* no-op */
      },
    }),
    {
      // Konfiguration für das persist-Middleware
      name: "typewriter-storage",
    },
  ),
)
