export function getActiveLineTextClass(darkMode: boolean): string {
  return `whitespace-pre absolute top-0 left-0 pointer-events-none overflow-hidden ${darkMode ? "text-gray-200" : "text-gray-800"}`
}
