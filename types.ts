/**
 * Legacy line break config (kept for compatibility)
 */
export interface LineBreakConfig {
  maxCharsPerLine: number
  autoMaxChars: boolean
}

export interface Line {
  id: string
  text: string
}

export interface TextStatistics {
  wordCount: number
  letterCount: number
  pageCount: number
}

export type WrapMode = "hard-hyphen" | "word-wrap"

export interface TypewriterState {
  lines: Line[]
  activeLine: string
  maxCharsPerLine: number // legacy UI only
  statistics: TextStatistics
  lineBreakConfig: LineBreakConfig
  fontSize: number
  stackFontSize: number
  darkMode: boolean
  paragraphRanges: any[]
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

  // Wrapping spec additions
  wrapMode: WrapMode
  hyphenChar: string
  maxUserCols?: number
  maxAutoCols: number
  avgGraphemeWidth: number
}

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
  cancelSave: () => void
  setContainerWidth: (width: number) => void
  setOffset: (offset: number) => void
  toggleFlowMode: () => void
  handleKeyPress: (key: string) => void

  // Wrapping config actions
  setWrapMode: (mode: WrapMode) => void
  setHyphenChar: (c: string) => void
  setUserMaxCols: (n: number) => void
  setTextMetrics: (m: { avgGraphemeWidth: number; maxAutoCols: number }) => void

  // Internal helper (not used by UI directly)
  _commitLine?: (lineText: string, remainder: string) => void
}
