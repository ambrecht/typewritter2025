import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  LineBreakConfig,
  FormattedLine,
  ParagraphRange,
  TextStatistics,
  FlowModeConfig,
} from '@/types';
import { calculateTextStatistics } from '@/utils/text-statistics';
import { saveText, getLastSession } from '@/utils/api';

// Konstanten
const DEFAULT_LINE_BREAK_CONFIG: LineBreakConfig = {
  maxCharsPerLine: 56,
  autoMaxChars: true, // Standardmäßig aktiviert
};

const DEFAULT_TEXT_STATISTICS: TextStatistics = {
  wordCount: 0,
  letterCount: 0,
  pageCount: 0,
};

const DEFAULT_FLOW_MODE: FlowModeConfig = {
  enabled: false,
  noPunctuation: true,
  noBackspace: true,
  timerType: 'time',
  timerTarget: 15,
};

// Ändere den INITIAL_STATE, um Sound standardmäßig zu deaktivieren
const INITIAL_STATE: TypewriterState & {
  mode: 'typing' | 'navigating';
  selectedLineIndex: number | null;
  isSaving: boolean;
  isLoading: boolean;
  lastSaveStatus: {
    success: boolean;
    message: string;
    timestamp: number;
  } | null;
} = {
  lines: [],
  activeLine: '',
  maxCharsPerLine: DEFAULT_LINE_BREAK_CONFIG.maxCharsPerLine,
  statistics: DEFAULT_TEXT_STATISTICS,
  lineBreakConfig: DEFAULT_LINE_BREAK_CONFIG,
  fontSize: 24,
  stackFontSize: 16,
  darkMode: false,
  paragraphRanges: [],
  inParagraph: false,
  currentParagraphStart: -1,
  flowMode: DEFAULT_FLOW_MODE,

  // Neue Zustandsvariablen
  mode: 'typing',
  selectedLineIndex: null,

  // Speicher-Status
  isSaving: false,
  isLoading: false,
  lastSaveStatus: null,
};

/**
 * Berechnet die Textstatistiken basierend auf allen Zeilen und der aktiven Zeile
 *
 * @param lines - Array von formatierten Zeilen
 * @param activeLine - Aktuelle Zeile
 * @returns Textstatistiken
 */
const computeTextStatistics = (
  lines: FormattedLine[],
  activeLine: string,
): TextStatistics => {
  const allText = [...lines.map((line) => line.text), activeLine].join(' ');
  return calculateTextStatistics(allText);
};

/**
 * Entfernt Satzzeichen aus einem Text
 */
const removePunctuation = (text: string): string => {
  // Entferne alle Satzzeichen, behalte aber Leerzeichen und Buchstaben
  return text.replace(/[^\w\s]/g, '');
};

/**
 * Verarbeitet Absatzmarkierungen und aktualisiert die Absatzbereiche
 *
 * @param state - Aktueller Zustand
 * @param newLines - Neue Zeilen
 * @param lineIndex - Index der aktuellen Zeile
 * @returns Aktualisierte Absatzinformationen
 */
const processParagraphMarkers = (
  state: TypewriterState,
  newLines: FormattedLine[],
  lineIndex: number,
): {
  inParagraph: boolean;
  currentParagraphStart: number;
  paragraphRanges: ParagraphRange[];
} => {
  let inParagraph = state.inParagraph;
  let currentParagraphStart = state.currentParagraphStart;
  const paragraphRanges = [...state.paragraphRanges];

  // Prüfe auf Absatzmarkierungen
  const line = state.activeLine;

  // Wenn die Zeile genau *** ist, schalte den Absatzzustand um
  if (line.trim() === '***') {
    if (!inParagraph) {
      // Starte einen neuen Absatz
      inParagraph = true;
      currentParagraphStart = lineIndex;
    } else {
      // Beende einen Absatz
      inParagraph = false;

      // Füge den Absatzbereich hinzu
      if (currentParagraphStart >= 0) {
        paragraphRanges.push({
          start: currentParagraphStart,
          end: lineIndex - 1, // Ende ist die vorherige Zeile, nicht die Markierung
        });
        currentParagraphStart = -1;
      }
    }
    return { inParagraph, currentParagraphStart, paragraphRanges };
  }

  // Wenn die Zeile mit *** beginnt und endet, ist es ein Absatz
  if (
    line.trim().startsWith('***') &&
    line.trim().endsWith('***') &&
    line.trim().length > 6
  ) {
    // Füge einen einzelnen Absatz hinzu
    paragraphRanges.push({
      start: lineIndex,
      end: lineIndex,
    });
    return { inParagraph, currentParagraphStart, paragraphRanges };
  }

  return { inParagraph, currentParagraphStart, paragraphRanges };
};

export interface TypewriterActions {
  setActiveLine: (text: string) => void;
  addLineToStack: () => void;
  updateLineBreakConfig: (config: Partial<LineBreakConfig>) => void;
  setFontSize: (size: number) => void;
  setStackFontSize: (size: number) => void;
  setFixedLineLength: (length: number) => void;
  toggleDarkMode: () => void;
  clearCurrentInput: () => void;
  clearAllLines: () => void;
  resetSession: () => void;
  saveSession: () => Promise<void>;
  updateFlowMode: (config: Partial<FlowModeConfig>) => void;
  startFlowMode: (timerType: 'time' | 'words', target: number) => void;
  stopFlowMode: () => void;
}

export interface TypewriterState {
  lines: FormattedLine[];
  activeLine: string;
  maxCharsPerLine: number;
  statistics: TextStatistics;
  lineBreakConfig: LineBreakConfig;
  fontSize: number;
  stackFontSize: number;
  darkMode: boolean;
  paragraphRanges: ParagraphRange[];
  inParagraph: boolean;
  currentParagraphStart: number;
  flowMode: FlowModeConfig;
}

// Füge die Sound-Aktionen zum Store hinzu
export const useTypewriterStore = create<
  TypewriterState &
    TypewriterActions & {
      mode: 'typing' | 'navigating';
      selectedLineIndex: number | null;
      isSaving: boolean;
      isLoading: boolean;
      lastSaveStatus: {
        success: boolean;
        message: string;
        timestamp: number;
      } | null;
      setMode: (mode: 'typing' | 'navigating') => void;
      setSelectedLineIndex: (index: number | null) => void;
      navigateUp: () => void;
      navigateDown: () => void;
      navigateForward: (steps?: number) => void;
      navigateBackward: (steps?: number) => void;
      resetNavigation: () => void;
      saveSession: () => Promise<void>;
      loadLastSession: () => Promise<void>;
    }
>(
  persist(
    (set, get) => ({
      ...INITIAL_STATE,

      /**
       * Setzt die aktive Zeile und aktualisiert Statistiken.
       * Wenn wir im Navigationsmodus sind, wechseln wir zurück zum Schreibmodus.
       */
      setActiveLine: (text: string) =>
        set((state) => {
          let processedText = text;

          // Flow Mode: Satzzeichen entfernen
          if (state.flowMode.enabled && state.flowMode.noPunctuation) {
            processedText = removePunctuation(text);
          }

          // Berechne Statistiken basierend auf dem gesamten Text
          const statistics = computeTextStatistics(state.lines, processedText);

          // Wenn wir im Navigationsmodus sind, wechseln wir zurück zum Schreibmodus
          if (state.mode === 'navigating') {
            return {
              activeLine: processedText,
              statistics,
              mode: 'typing',
              selectedLineIndex: null,
            };
          }

          return {
            activeLine: processedText,
            statistics,
          };
        }),

      /**
       * Fügt die aktive Zeile zum Stack hinzu und setzt die aktive Zeile zurück.
       */
      addLineToStack: () =>
        set((state) => {
          // Wenn die aktive Zeile leer ist, ändere nichts
          if (!state.activeLine.trim()) return state;

          // Unterstütze Mehrzeilenformatierung
          const lines = state.activeLine.split('\n');

          if (lines.length > 1) {
            // Verarbeite mehrere Zeilen als einfache Textzeilen
            const formattedLines = lines.map((line) => ({ text: line }));
            const newLines = [...state.lines, ...formattedLines];

            // Aktualisiere Absatzinformationen für die letzte Zeile
            const lineIndex = newLines.length - 1;
            const paragraphInfo = processParagraphMarkers(
              state,
              newLines,
              lineIndex,
            );

            return {
              lines: newLines,
              activeLine: '',
              ...paragraphInfo,
            };
          } else {
            // Erstelle eine einfache Textzeile
            const formattedLine = { text: state.activeLine };

            // Füge die formatierte Zeile zum Stack hinzu
            const newLines = [...state.lines, formattedLine];
            const lineIndex = newLines.length - 1;

            // Verarbeite Absatzmarkierungen
            const paragraphInfo = processParagraphMarkers(
              state,
              newLines,
              lineIndex,
            );

            return {
              lines: newLines,
              activeLine: '',
              ...paragraphInfo,
            };
          }
        }),

      /**
       * Aktualisiert die Zeilenumbruchkonfiguration.
       */
      updateLineBreakConfig: (config: Partial<LineBreakConfig>) =>
        set((state) => {
          // Prüfe, ob sich die Konfiguration tatsächlich ändert
          const hasChanges = Object.entries(config).some(
            ([key, value]) =>
              state.lineBreakConfig[key as keyof LineBreakConfig] !== value,
          );

          // Wenn keine Änderungen, gib den aktuellen Zustand zurück
          if (!hasChanges) return state;

          // Erstelle eine neue Konfiguration mit den neuen Werten
          const newConfig: LineBreakConfig = {
            ...state.lineBreakConfig,
            ...config,
          };

          return {
            lineBreakConfig: newConfig,
            maxCharsPerLine: newConfig.maxCharsPerLine,
          };
        }),

      /**
       * Setzt die Schriftgröße für die aktive Zeile.
       */
      setFontSize: (size: number) =>
        set(() => ({ fontSize: Math.max(9, Math.min(64, size)) })),

      /**
       * Setzt die Schriftgröße für den Stack vorheriger Zeilen.
       */
      setStackFontSize: (size: number) =>
        set(() => ({ stackFontSize: Math.max(9, Math.min(64, size)) })),

      /**
       * Setzt eine feste Zeilenlänge mit erweiterten Einschränkungen (20-100 Zeichen).
       */
      setFixedLineLength: (length: number) => {
        // Stelle sicher, dass die Länge innerhalb des erlaubten Bereichs liegt
        const constrainedLength = Math.min(Math.max(length, 20), 100); // Erhöht von 10-60

        set(() => {
          // Erstelle eine neue Konfiguration mit fester Zeilenlänge
          const newConfig: LineBreakConfig = {
            maxCharsPerLine: constrainedLength,
            autoMaxChars: false,
          };

          return {
            lineBreakConfig: newConfig,
            maxCharsPerLine: constrainedLength,
          };
        });
      },

      /**
       * Schaltet den Dark Mode um.
       */
      toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),

      /**
       * Löscht die aktuelle Eingabe.
       */
      clearCurrentInput: () =>
        set(() => ({
          activeLine: '',
        })),

      /**
       * Löscht alle Zeilen im Stack.
       */
      clearAllLines: () =>
        set(() => ({
          lines: [],
          statistics: DEFAULT_TEXT_STATISTICS,
          paragraphRanges: [],
          inParagraph: false,
          currentParagraphStart: -1,
        })),

      /**
       * Setzt die Sitzung zurück, indem alle Zeilen und Statistiken gelöscht werden.
       */
      resetSession: () =>
        set(() => ({
          lines: [],
          activeLine: '',
          statistics: DEFAULT_TEXT_STATISTICS,
          paragraphRanges: [],
          inParagraph: false,
          currentParagraphStart: -1,
          mode: 'typing',
          selectedLineIndex: null,
        })),

      /**
       * Speichert die aktuelle Sitzung in der API und löscht dann den State
       */
      saveSession: async () => {
        const state = get();

        // Setze den Speicherstatus auf "wird gespeichert"
        set({ isSaving: true });

        try {
          // Sammle den gesamten Text
          const allText = [
            ...state.lines.map((line) => line.text),
            state.activeLine,
          ]
            .filter(Boolean)
            .join('\n');

          // Sende den Text an die API (API-Key wird automatisch aus Umgebungsvariable gelesen)
          const result = await saveText(allText);

          // Aktualisiere den Speicherstatus
          set({
            isSaving: false,
            lastSaveStatus: {
              success: result.success,
              message: result.message,
              timestamp: Date.now(),
            },
          });

          // Wenn das Speichern erfolgreich war, setze die Sitzung zurück
          if (result.success) {
            // Warte kurz, damit der Benutzer die Erfolgsmeldung sehen kann
            setTimeout(() => {
              get().resetSession();
            }, 500);
          }

          // Wenn der Fehler auf einen ungültigen API-Schlüssel hinweist, zeige eine spezifischere Meldung
          if (
            !result.success &&
            result.message &&
            (result.message.includes('API-Schlüssel') ||
              result.message.includes('Ungültiger') ||
              result.message.includes('nicht gefunden'))
          ) {
            set({
              lastSaveStatus: {
                success: false,
                message:
                  'API-Schlüssel ungültig oder nicht gefunden. Bitte überprüfen Sie Ihre Einstellungen.',
                timestamp: Date.now(),
              },
            });
          }
        } catch (error) {
          // Bei Fehler: Aktualisiere den Speicherstatus
          set({
            isSaving: false,
            lastSaveStatus: {
              success: false,
              message:
                error instanceof Error
                  ? error.message
                  : 'Unbekannter Fehler beim Speichern',
              timestamp: Date.now(),
            },
          });
        }
      },

      /**
       * Lädt die zuletzt gespeicherte Sitzung aus der API
       */
      loadLastSession: async () => {
        // Setze den Ladestatus auf "wird geladen"
        set({ isLoading: true });

        try {
          // Hole die letzte Sitzung von der API (API-Key wird automatisch aus Umgebungsvariable gelesen)
          const result = await getLastSession();

          if (result.success && result.text) {
            // Teile den Text in Zeilen auf und entferne leere Zeilen am Ende
            const textLines = result.text.split('\n');

            // Verarbeite die Zeilen als einfache Textzeilen
            const formattedLines = textLines.map((line) => ({ text: line }));

            // Berechne Absatzbereiche neu
            const paragraphRanges: ParagraphRange[] = [];
            let inParagraph = false;
            let currentParagraphStart = -1;

            // Durchlaufe alle Zeilen und identifiziere Absätze
            formattedLines.forEach((line, index) => {
              if (line.text.trim() === '***') {
                // Absatzmarker
                if (!inParagraph) {
                  // Starte einen neuen Absatz
                  inParagraph = true;
                  currentParagraphStart = index + 1; // Der Absatz beginnt nach dem Marker
                } else {
                  // Beende einen Absatz
                  if (
                    currentParagraphStart >= 0 &&
                    index > currentParagraphStart
                  ) {
                    paragraphRanges.push({
                      start: currentParagraphStart,
                      end: index - 1, // Ende ist die Zeile vor dem Marker
                    });
                  }
                  inParagraph = false;
                  currentParagraphStart = -1;
                }
              }
            });

            // Wenn wir am Ende noch in einem Absatz sind, füge ihn hinzu
            if (inParagraph && currentParagraphStart >= 0) {
              paragraphRanges.push({
                start: currentParagraphStart,
                end: formattedLines.length - 1,
              });
            }

            // Setze den neuen Zustand
            set({
              lines: formattedLines,
              activeLine: '',
              statistics: {
                wordCount:
                  result.wordCount ||
                  calculateTextStatistics(result.text).wordCount,
                letterCount:
                  result.letterCount ||
                  calculateTextStatistics(result.text).letterCount,
                pageCount:
                  Math.floor((result.letterCount || 0) / 1600) ||
                  calculateTextStatistics(result.text).pageCount,
              },
              paragraphRanges: paragraphRanges,
              inParagraph: false,
              currentParagraphStart: -1,
              mode: 'typing',
              selectedLineIndex: null,
              isLoading: false,
              lastSaveStatus: {
                success: true,
                message: `Sitzung vom ${new Date(
                  result.createdAt || Date.now(),
                ).toLocaleString()} geladen`,
                timestamp: Date.now(),
              },
            });
          } else {
            // Bei Fehler: Aktualisiere den Ladestatus
            set({
              isLoading: false,
              lastSaveStatus: {
                success: false,
                message:
                  result.message || 'Keine gespeicherte Sitzung gefunden',
                timestamp: Date.now(),
              },
            });

            // Wenn der Fehler auf einen ungültigen API-Schlüssel hinweist, zeige eine spezifischere Meldung
            if (
              result.message &&
              (result.message.includes('API-Schlüssel') ||
                result.message.includes('Ungültiger') ||
                result.message.includes('nicht gefunden'))
            ) {
              set({
                lastSaveStatus: {
                  success: false,
                  message:
                    'API-Schlüssel ungültig oder nicht gefunden. Bitte überprüfen Sie Ihre Einstellungen.',
                  timestamp: Date.now(),
                },
              });
            }
          }
        } catch (error) {
          // Bei Fehler: Aktualisiere den Ladestatus
          set({
            isLoading: false,
            lastSaveStatus: {
              success: false,
              message:
                error instanceof Error
                  ? error.message
                  : 'Unbekannter Fehler beim Laden',
              timestamp: Date.now(),
            },
          });
        }
      },

      /**
       * Setzt den Modus (typing oder navigating).
       */
      setMode: (mode: 'typing' | 'navigating') => set(() => ({ mode })),

      /**
       * Setzt den ausgewählten Zeilenindex.
       */
      setSelectedLineIndex: (index: number | null) =>
        set(() => ({ selectedLineIndex: index })),

      /**
       * Navigiert eine Zeile nach oben im Stack.
       */
      navigateUp: () =>
        set((state) => {
          const { lines, selectedLineIndex, mode } = state;

          // Wenn keine Zeilen vorhanden sind, nichts tun
          if (lines.length === 0) return state;

          // Wenn wir noch nicht im Navigationsmodus sind, wechseln wir dazu
          // und setzen den Index auf die letzte Zeile
          if (mode !== 'navigating') {
            return {
              mode: 'navigating',
              selectedLineIndex: lines.length - 1,
            };
          }

          // Wenn bereits ein Index ausgewählt ist, gehen wir eine Zeile nach oben
          if (selectedLineIndex !== null) {
            const newIndex = Math.max(0, selectedLineIndex - 1);
            return { selectedLineIndex: newIndex };
          } else {
            // Wenn kein Index ausgewählt ist, setzen wir ihn auf die letzte Zeile
            return { selectedLineIndex: lines.length - 1 };
          }
        }),

      /**
       * Navigiert eine Zeile nach unten im Stack.
       */
      navigateDown: () =>
        set((state) => {
          const { lines, selectedLineIndex, mode } = state;

          // Wenn keine Zeilen vorhanden sind, nichts tun
          if (lines.length === 0) return state;

          // Wenn wir noch nicht im Navigationsmodus sind, wechseln wir dazu
          // und setzen den Index auf die erste Zeile
          if (mode !== 'navigating') {
            return {
              mode: 'navigating',
              selectedLineIndex: 0,
            };
          }

          // Wenn bereits ein Index ausgewählt ist, gehen wir eine Zeile nach unten
          if (selectedLineIndex !== null) {
            // Wenn wir am Ende des Stacks sind, kehren wir zum Schreibmodus zurück
            if (selectedLineIndex >= lines.length - 1) {
              return {
                mode: 'typing',
                selectedLineIndex: null,
              };
            } else {
              // Sonst gehen wir eine Zeile nach unten
              const newIndex = Math.min(
                lines.length - 1,
                selectedLineIndex + 1,
              );
              return { selectedLineIndex: newIndex };
            }
          } else {
            // Wenn kein Index ausgewählt ist, setzen wir ihn auf die erste Zeile
            return { selectedLineIndex: 0 };
          }
        }),

      /**
       * Navigiert mehrere Zeilen vorwärts im Stack (nach unten).
       * @param steps - Anzahl der Schritte (Standard: 10)
       */
      navigateForward: (steps = 10) =>
        set((state) => {
          const { lines, selectedLineIndex, mode } = state;

          // Wenn keine Zeilen vorhanden sind, nichts tun
          if (lines.length === 0) return state;

          // Wenn wir noch nicht im Navigationsmodus sind, wechseln wir dazu
          // und setzen den Index auf die erste Zeile
          if (mode !== 'navigating') {
            return {
              mode: 'navigating',
              selectedLineIndex: 0,
            };
          }

          // Wenn bereits ein Index ausgewählt ist, gehen wir mehrere Zeilen nach unten
          if (selectedLineIndex !== null) {
            // Berechne den neuen Index
            const newIndex = Math.min(
              lines.length - 1,
              selectedLineIndex + steps,
            );

            // Wenn wir am Ende des Stacks sind, kehren wir zum Schreibmodus zurück
            if (newIndex >= lines.length - 1) {
              return {
                mode: 'typing',
                selectedLineIndex: null,
              };
            } else {
              // Sonst gehen wir mehrere Zeilen nach unten
              return { selectedLineIndex: newIndex };
            }
          } else {
            // Wenn kein Index ausgewählt ist, setzen wir ihn auf die erste Zeile
            return { selectedLineIndex: 0 };
          }
        }),

      /**
       * Navigiert mehrere Zeilen rückwärts im Stack (nach oben).
       * @param steps - Anzahl der Schritte (Standard: 10)
       */
      navigateBackward: (steps = 10) =>
        set((state) => {
          const { lines, selectedLineIndex, mode } = state;

          // Wenn keine Zeilen vorhanden sind, nichts tun
          if (lines.length === 0) return state;

          // Wenn wir noch nicht im Navigationsmodus sind, wechseln wir dazu
          // und setzen den Index auf die letzte Zeile
          if (mode !== 'navigating') {
            return {
              mode: 'navigating',
              selectedLineIndex: lines.length - 1,
            };
          }

          // Wenn bereits ein Index ausgewählt ist, gehen wir mehrere Zeilen nach oben
          if (selectedLineIndex !== null) {
            const newIndex = Math.max(0, selectedLineIndex - steps);
            return { selectedLineIndex: newIndex };
          } else {
            // Wenn kein Index ausgewählt ist, setzen wir ihn auf die letzte Zeile
            return { selectedLineIndex: lines.length - 1 };
          }
        }),

      /**
       * Setzt die Navigation zurück (wechselt zum Schreibmodus).
       */
      resetNavigation: () =>
        set(() => ({
          mode: 'typing',
          selectedLineIndex: null,
        })),

      /**
       * Aktualisiert die Flow Mode Konfiguration.
       */
      updateFlowMode: (config: Partial<FlowModeConfig>) =>
        set((state) => ({
          flowMode: {
            ...state.flowMode,
            ...config,
          },
        })),

      /**
       * Startet den Flow Mode mit Timer.
       */
      startFlowMode: (timerType: 'time' | 'words', target: number) =>
        set((state) => ({
          flowMode: {
            ...state.flowMode,
            enabled: true,
            timerType,
            timerTarget: target,
            timerStartTime: Date.now(),
            initialWordCount: state.statistics.wordCount,
          },
        })),

      /**
       * Beendet den Flow Mode.
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
    }),
    {
      // Konfiguration für das persist-Middleware
      name: 'typewriter-storage',
    },
  ),
);
