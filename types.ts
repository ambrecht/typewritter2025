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
 * Markdown-Formatierungstypen
 */
export enum MarkdownType {
  NORMAL = "normal",
  HEADING1 = "heading1",
  HEADING2 = "heading2",
  HEADING3 = "heading3",
  BLOCKQUOTE = "blockquote",
  UNORDERED_LIST = "unordered-list",
  ORDERED_LIST = "ordered-list",
  DIALOG = "dialog",
  CODE = "code",
  HORIZONTAL_RULE = "horizontal-rule",
  PARAGRAPH = "paragraph",
}

/**
 * Metadaten für formatierte Zeilen
 */
export interface LineMetadata {
  /** Listennummer für geordnete Listen */
  listNumber?: number
  /** Charaktername für Dialog */
  character?: string
  /** Einrückungsebene */
  indentLevel?: number
}

/**
 * Repräsentiert eine Zeile mit ihrer Formatierung
 */
export interface FormattedLine {
  /** Der Textinhalt der Zeile */
  text: string
  /** Der Markdown-Formatierungstyp */
  type: MarkdownType
  /** Zusätzliche Formatierungsdaten */
  meta?: LineMetadata
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
 * Konfiguration für den Flow Mode
 */
export interface FlowModeConfig {
  /** Ist der Flow Mode aktiv? */
  enabled: boolean
  /** Soll das Löschen mit Backspace deaktiviert sein? */
  noBackspace: boolean
  /** Sollen Satzzeichen automatisch entfernt werden? */
  noPunctuation: boolean
  /** Art des Timers: Zeit oder Wortanzahl */
  timerType: "time" | "words"
  /** Zielwert (Minuten oder Wörter) */
  timerTarget: number
  /** Startzeit des Timers (Millisekunden seit Epoch) */
  timerStartTime?: number
  /** Wortzahl zu Beginn des Timers */
  initialWordCount?: number
}

/**
 * Typewriter-Anwendungszustand
 */
export interface TypewriterState {
  /** Array bereits geschriebener Zeilen */
  lines: FormattedLine[]
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
  /** Aktueller Markdown-Formatierungstyp für die aktive Zeile */
  activeLineType: MarkdownType
  /** Aktueller Modus (Schreiben oder Navigieren) */
  mode: "typing" | "navigating"
  /** Index der aktuell ausgewählten Zeile (null, wenn keine ausgewählt ist) */
  selectedLineIndex: number | null
}

/**
 * Aktionen für den Typewriter-Store
 */
export interface TypewriterActions {
  /** Funktion zum Setzen der aktiven Zeile */
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
  /** Funktion zum Navigieren nach oben im Stack */
  navigateUp: () => void
  /** Funktion zum Navigieren nach unten im Stack */
  navigateDown: () => void
  /** Funktion zum Zurücksetzen der Navigation */
  resetNavigation: () => void
}
