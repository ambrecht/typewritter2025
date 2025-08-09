/**
 * Konfiguration für Zeilenumbrüche (Legacy)
 */
export interface LineBreakConfig {
  maxCharsPerLine: number
  autoMaxChars: boolean
}

/**
 * Ergebnis einer Zeilenumbruchoperation
 */
export interface LineBreakResult {
  line: string
  remainder: string
}

/**
 * Absatzbereich
 */
export interface ParagraphRange {
  start: number
  end: number
}

/**
 * Zeile im Stack
 */
export interface Line {
  id: string
  text: string
}

export enum MarkdownType {
  NORMAL = "normal",
  HEADING1 = "heading1",
  HEADING2 = "heading2",
  HEADING3 = "heading3",
  BLOCKQUOTE = "blockquote",
  UNORDERED_LIST = "unordered_list",
  ORDERED_LIST = "ordered_list",
  DIALOG = "dialog",
  CODE = "code",
  PARAGRAPH = "paragraph",
}

export interface FormattedLine {
  text: string
  type: MarkdownType
  level?: number
  order?: number
}

export interface TextStatistics {
  wordCount: number
  letterCount: number
  pageCount: number
}

// New wrap configuration
export type WrapMode = "hard-hyphen" | "word-wrap"

/**
 * Typewriter state
 */
export interface TypewriterState {
  lines: Line[]
  activeLine: string
  maxCharsPerLine: number // legacy UI
  statistics: TextStatistics
  lineBreakConfig: LineBreakConfig
  fontSize: number
  stackFontSize: number
  darkMode: boolean
  paragraphRanges: ParagraphRange[]
  inParagraph: boolean
  currentParagraphStart: number
  mode: "write" | "nav"
  selectedLineIndex: number | null
  offset: number
  maxVisibleLines: number
  lastSaveStatus: { success: boolean; message: string } | null
  isSaving: boolean
  isLoading: boolean
  containerWidth: number
  flowMode: boolean

  // New
  wrapMode: WrapMode
  hyphenChar: string
  maxUserCols?: number
  maxAutoCols: number
  avgGraphemeWidth: number
}

/**
 * Actions
 */
export interface TypewriterActions {
  setActiveLine: (text: string) => void
  addLineToStack: () => void
  updateLineBreakConfig: (config: Partial<LineBreakConfig>) => void
  setFontSize: (size: number) => void
  setStackFontSize: (size: number) => void
  toggleDarkMode: () => void
  clearCurrentInput: () => void
  clearAllLines: () => void
  resetSession: () => void
  setFixedLineLength: (length: number) => void
  setMode: (mode: "write" | "nav") => void
  setSelectedLineIndex: (index: number | null) => void
  setMaxVisibleLines: (count: number) => void
  adjustOffset: (delta: number) => void
  navigateUp: () => void
  navigateDown: () => void
  resetNavigation: () => void
  saveSession: () => Promise<void>
  loadLastSession: () => Promise<void>
  setContainerWidth: (width: number) => void
  setOffset: (offset: number) => void
  toggleFlowMode: () => void
  handleKeyPress: (key: string) => void

  // New config
  setWrapMode: (mode: WrapMode) => void
  setHyphenChar: (c: string) => void
  setUserMaxCols: (n: number) => void
  setTextMetrics: (m: { avgGraphemeWidth: number; maxAutoCols: number }) => void

  // Internal helper used by store only (not exported in UI, but typed here for completeness)
  _commitLine?: (lineText: string, remainder: string) => void
}
