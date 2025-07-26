import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import type { TypewriterState, TypewriterActions, LineBreakConfig } from "@/types"
import { calculateTextStatistics } from "@/utils/text-statistics"
import { saveText, getLastSession } from "@/utils/api"
import { measureTextWidth } from "@/utils/canvas-utils"

/**
 * @constant initialState
 * @description Der initiale Zustand der Typewriter-Anwendung.
 * Wird für den Start und beim Zurücksetzen der Sitzung verwendet.
 */
const initialState: Omit<TypewriterState, "lastSaveStatus" | "isSaving" | "isLoading" | "containerWidth"> = {
  lines: [],
  activeLine: "",
  maxCharsPerLine: 56, // Dient als Referenz und Fallback
  statistics: { wordCount: 0, letterCount: 0, pageCount: 0 },
  lineBreakConfig: { maxCharsPerLine: 56, autoMaxChars: true },
  fontSize: 24,
  stackFontSize: 18,
  darkMode: false,
  mode: "typing",
  selectedLineIndex: null,
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
       * Aktualisiert die Breite des Schreib-Containers.
       * Wichtig für die Berechnung des automatischen Zeilenumbruchs.
       * @param {number} width - Die neue Breite des Containers in Pixeln.
       */
      setContainerWidth: (width: number) => set({ containerWidth: width }),

      /**
       * Setzt den Text der aktiven Zeile und führt bei Bedarf einen automatischen Zeilenumbruch durch.
       * Dies ist die Kernlogik für das "fließende" Schreiben.
       * @param {string} text - Der neue Text aus dem Eingabefeld.
       */
      setActiveLine: (text) => {
        const { containerWidth, fontSize, lines, lineBreakConfig } = get()

        // Wenn der automatische Umbruch deaktiviert ist, Text einfach setzen.
        if (!lineBreakConfig.autoMaxChars) {
          const newFullText = [...lines, text].join("\n")
          set({
            activeLine: text,
            statistics: calculateTextStatistics(newFullText),
          })
          return
        }

        const font = `${fontSize}px "Lora", serif`
        // Abzug für Padding (p-4/p-6 in Tailwind)
        const availableWidth = containerWidth > 48 ? containerWidth - 48 : containerWidth

        /**
         * Rekursive Hilfsfunktion, die einen Text so lange umbricht, bis er in die verfügbare Breite passt.
         * @param {string} currentText - Der zu verarbeitende Text.
         * @param {string[]} currentLines - Die bisher angesammelten neuen Zeilen.
         * @returns {{ finalLines: string[], finalActiveLine: string }} - Die neuen Zeilen und die verbleibende aktive Zeile.
         */
        const processLine = (
          currentText: string,
          currentLines: string[],
        ): { finalLines: string[]; finalActiveLine: string } => {
          const textWidth = measureTextWidth(currentText, font)

          // Wenn der Text passt, ist die Rekursion beendet.
          if (textWidth <= availableWidth) {
            return { finalLines: currentLines, finalActiveLine: currentText }
          }

          // Text ist zu lang, finde den optimalen Umbruchpunkt.
          let breakPoint = -1
          // Finde das letzte Zeichen, das gerade noch in die Zeile passt.
          for (let i = currentText.length - 1; i >= 0; i--) {
            if (measureTextWidth(currentText.substring(0, i), font) <= availableWidth) {
              breakPoint = i
              break
            }
          }

          // Wenn kein Umbruchpunkt gefunden wurde (z.B. bei einem sehr langen Wort), beende.
          if (breakPoint <= 0) {
            return { finalLines: currentLines, finalActiveLine: currentText }
          }

          const fittingText = currentText.substring(0, breakPoint)
          const lastSpaceIndex = fittingText.lastIndexOf(" ")

          let lineToAdd: string
          let remainder: string

          // Bevorzuge einen "weichen" Umbruch am letzten Leerzeichen.
          if (lastSpaceIndex > 0) {
            lineToAdd = currentText.substring(0, lastSpaceIndex)
            remainder = currentText.substring(lastSpaceIndex + 1)
          } else {
            // Wenn kein Leerzeichen gefunden, erzwinge einen "harten" Umbruch.
            lineToAdd = fittingText
            remainder = currentText.substring(breakPoint)
          }

          const newLines = [...currentLines, lineToAdd]
          // Verarbeite den restlichen Text rekursiv.
          return processLine(remainder, newLines)
        }

        // Starte den Umbruchprozess mit dem aktuellen Text und den bestehenden Zeilen.
        const { finalLines, finalActiveLine } = processLine(text, lines)

        const newFullText = [...finalLines, finalActiveLine].join("\n")
        set({
          lines: finalLines,
          activeLine: finalActiveLine,
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
        if (activeLine.trim() === "" && lines.length > 0 && lines[lines.length - 1].trim() === "") {
          return
        }
        const newLines = [...lines, activeLine]
        const newText = newLines.join("\n")
        set({
          lines: newLines,
          activeLine: "",
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
        set({ lines: [], activeLine: "", statistics: { wordCount: 0, letterCount: 0, pageCount: 0 } }),

      /**
       * Setzt die gesamte Sitzung auf den initialen Zustand zurück.
       */
      resetSession: () => set({ ...initialState, containerWidth: get().containerWidth }),

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
       * Navigiert eine Zeile nach oben im Stack.
       */
      navigateUp: () => {
        const { lines, selectedLineIndex } = get()
        if (lines.length === 0) return
        const newIndex = selectedLineIndex === null ? lines.length - 1 : Math.max(0, selectedLineIndex - 1)
        set({ mode: "navigating", selectedLineIndex: newIndex })
      },

      /**
       * Navigiert eine Zeile nach unten im Stack oder beendet den Navigationsmodus.
       */
      navigateDown: () => {
        const { lines, selectedLineIndex } = get()
        if (selectedLineIndex === null || selectedLineIndex >= lines.length - 1) {
          get().resetNavigation()
        } else {
          set({ selectedLineIndex: selectedLineIndex + 1 })
        }
      },

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
        set({ mode: "typing", selectedLineIndex: null })
      },

      /**
       * Speichert die aktuelle Sitzung über die API.
       */
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

      /**
       * Lädt die letzte gespeicherte Sitzung von der API.
       */
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
      // Konfiguration für die Persistenz-Middleware
      name: "typewriter-storage", // Eindeutiger Name für den LocalStorage-Key
      storage: createJSONStorage(() => localStorage), // Verwende LocalStorage
      /**
       * Wird nach dem Laden des Zustands aus dem Storage ausgeführt.
       * Ermöglicht die Migration von alten Datenformaten.
       */
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Migrationslogik für ein veraltetes Datenformat, bei dem Zeilen Objekte waren.
          if (
            state.lines &&
            state.lines.length > 0 &&
            typeof state.lines[0] === "object" &&
            state.lines[0] !== null &&
            "text" in state.lines[0]
          ) {
            console.log("Veraltetes Datenformat erkannt. Migriere 'lines'-Zustand.")
            state.lines = state.lines.map((line: any) => (typeof line.text === "string" ? line.text : ""))
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
