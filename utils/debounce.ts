/**
 * Erstellt eine debounced Version einer Funktion
 *
 * @param func - Die zu debounce-nde Funktion
 * @param wait - Die Wartezeit in Millisekunden
 * @returns Eine debounced Funktion
 */
export function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}
