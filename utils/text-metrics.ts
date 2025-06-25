/**
 * Liefert die exakte Breite eines einzigen Zeichens in Pixel.
 * Basis: breitester Buchstabe „M“ in der eingestellten Schrift.
 */
export function measureCharWidth(
  fontFamily: string,
  fontSizePx: number,
): number {
  const span = document.createElement('span');
  span.textContent = 'M';
  span.style.cssText = `
    position:absolute;
    visibility:hidden;
    top:-9999px;
    font-family:${fontFamily};
    font-size:${fontSizePx}px;
  `;
  document.body.appendChild(span);
  const width = span.getBoundingClientRect().width || 10; // Fallback
  span.remove();
  return width;
}
