/**
 * Konfiguration für Zeilenumbrüche
 */
export interface LineBreakConfig {
  /** Maximale Anzahl von Zeichen pro Zeile (Standard: 56) */
  maxCharsPerLine: number
  /** Automatische Berechnung der Zeilenlänge basierend auf dem Viewport */
  autoMaxChars: boolean
}

/**
 * Ergebnis einer Zeilenumbruchoperation
 */
export interface LineBreakResult {
  /** Text, der in die aktuelle Zeile passt */
  line: string
  /** Verbleibender Text, der in die nächste Zeile verschoben werden soll */
  remainder: string
}

/**
 * Repräsentiert einen Bereich von Zeilen, die einen Absatz bilden
 */
export interface ParagraphRange {
  /** Startindex der Zeile (inklusive) */
  start: number
  /** Endindex der Zeile (inklusive) */
  end: number
}

/**
 * Repräsentiert eine einfache Zeile Text
 */
export interface FormattedLine {
  /** Der Textinhalt der Zeile */
  text: string
}

/**
 * Statistiken für den Text
 */
export interface TextStatistics {
  /** Anzahl der Wörter im Text */
  wordCount: number
  /** Anzahl der Buchstaben im Text */
  letterCount: number
  /** Anzahl der Seiten im Text */
  pageCount: number
}

/**
 * Repräsentiert eine einzelne Zeile im Stack
 */
export interface Line {
  /** Eindeutige ID der Zeile */
  id: number
  /** Inhalt der Zeile */
  text: string
}

/**
 * Typewriter-Anwendungszustand
 */
export interface TypewriterState {
  /** Array bereits geschriebener Zeilen */
  lines: Line[]
  /** Aktuell bearbeitete Zeile */
  activeLine: string
  /** Maximale Anzahl von Zeichen pro Zeile */
  maxCharsPerLine: number
  /** Textstatistiken */
  statistics: TextStatistics
  /** Konfiguration für Zeilenumbrüche */
  lineBreakConfig: LineBreakConfig
  /** Schriftgröße in Pixeln für aktive Zeile */
  fontSize: number
  /** Schriftgröße in Pixeln für Stack vorheriger Zeilen */
  stackFontSize: number
  /** Ob der Dark Mode aktiviert ist */
  darkMode: boolean
  /** Array von Absatzbereichen (für Abwärtskompatibilität) */
  paragraphRanges: ParagraphRange[]
  /** Ob wir uns derzeit in einem Absatz befinden (für Abwärtskompatibilität) */
  inParagraph: boolean
  /** Startindex des aktuellen Absatzes (für Abwärtskompatibilität) */
  currentParagraphStart: number
  /** Aktueller Modus (Schreiben oder Navigieren) */
  mode: "typing" | "navigating"
  /** Index der aktuell ausgewählten Zeile (null, wenn keine ausgewählt ist) */
  selectedLineIndex: number | null
  /** Aktueller Versatz für die Anzeige der Zeilen */
  offset: number
  /** Maximale Anzahl sichtbarer Zeilen */
  maxVisibleLines: number
  /** Status der letzten Speicheroperation */
  lastSaveStatus: { success: boolean; message: string } | null
  /** Ob gerade gespeichert wird */
  isSaving: boolean
  /** Ob gerade geladen wird */
  isLoading: boolean
  /** Breite des Schreib-Containers in Pixeln */
  containerWidth: number
  /** Ob der Flow Mode (kein Löschen) aktiviert ist */
  flowMode: boolean
  /** Offset für die Berechnung der sichtbaren Zeilen */
  offset: number
}

/**
 * Aktionen für den Typewriter-Store
 */
export interface TypewriterActions {
  /** Funktion zum Setzen der aktiven Zeile (nur für internes Laden) */
  setActiveLine: (text: string) => void
  /** Funktion zum Hinzufügen der aktiven Zeile zum Stack */
  addLineToStack: () => void
  /** Funktion zum Aktualisieren der Konfiguration */
  updateLineBreakConfig: (config: Partial<LineBreakConfig>) => void
  /** Funktion zum Setzen der Schriftgröße für aktive Zeile */
  setFontSize: (size: number) => void
  /** Funktion zum Setzen der Schriftgröße für Stack vorheriger Zeilen */
  setStackFontSize: (size: number) => void
  /** Funktion zum Umschalten des Dark Mode */
  toggleDarkMode: () => void
  /** Funktion zum Löschen der aktuellen Eingabe */
  clearCurrentInput: () => void
  /** Funktion zum Löschen aller Zeilen */
  clearAllLines: () => void
  /** Funktion zum Zurücksetzen der Sitzung */
  resetSession: () => void
  /** Funktion zum Setzen einer festen Zeilenlänge */
  setFixedLineLength: (length: number) => void
  /** Funktion zum Setzen des Modus */
  setMode: (mode: "typing" | "navigating") => void
  /** Funktion zum Setzen des ausgewählten Zeilenindex */
  setSelectedLineIndex: (index: number | null) => void
  /** Aktualisiert die maximale Anzahl sichtbarer Zeilen */
  setMaxVisibleLines: (count: number) => void
  /** Passt den Versatz der sichtbaren Zeilen an */
  adjustOffset: (delta: number) => void
  /** Funktion zum Navigieren nach oben im Stack */
  navigateUp: () => void
  /** Funktion zum Navigieren nach unten im Stack */
  navigateDown: () => void
  /** Funktion zum Navigieren vorwärts (mehrere Zeilen) */
  navigateForward: (count: number) => void
  /** Funktion zum Navigieren rückwärts (mehrere Zeilen) */
  navigateBackward: (count: number) => void
  /** Funktion zum Zurücksetzen der Navigation */
  resetNavigation: () => void
  /** Funktion zum Speichern der aktuellen Sitzung */
  saveSession: () => Promise<void>
  /** Funktion zum Laden der letzten Sitzung */
  loadLastSession: () => Promise<void>
  /** Funktion zum Setzen der Container-Breite */
  setContainerWidth: (width: number) => void
  /** Funktion zum Setzen des Offsets für die sichtbaren Zeilen */
  setOffset: (offset: number) => void
  /** Schaltet den Flow Mode (kein Löschen) um */
  toggleFlowMode: () => void
  /** Verarbeitet einen Tastendruck für die Eingabe */
  handleKeyPress: (key: string) => void
}
