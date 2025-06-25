'use client';

import type React from 'react';
import type { FormattedLine } from '@/types';
import { memo } from 'react';

interface LineStackProps {
  visibleLines: { line: FormattedLine; index: number }[];
  lineRefs: React.MutableRefObject<(HTMLDivElement | null)[]>;
  darkMode: boolean;
  stackFontSize: number;
  mode: 'typing' | 'navigating';
  fontSize: number;
  paragraphRanges: any[];
  selectedLineIndex: number | null;
  isFullscreen?: boolean;
}

/**
 * Zeilen‑Stack ohne Markdown‑Logik.
 * CSS‑Layout bleibt exakt wie im Original.
 */
export const LineStack = memo(function LineStack({
  visibleLines,
  lineRefs,
  darkMode,
  stackFontSize,
  mode,
  fontSize,
  paragraphRanges, // ignoriert
  selectedLineIndex, // ignoriert
  isFullscreen = false,
}: LineStackProps) {
  // Element‑Typ: prüfe rudimentär auf horizontale Linie, ohne Annahme eines "type"‑Feldes
  function resolveElementType(
    line: FormattedLine,
  ): keyof React.JSX.IntrinsicElements {
    const raw = (line as any).raw ?? (line as any).text ?? '';
    if (typeof raw === 'string' && raw.trim() === '---') return 'hr';
    return 'div';
  }

  // Android‑Erkennung beibehalten → Einfluss auf lineHeight
  const isAndroid =
    typeof navigator !== 'undefined' && navigator.userAgent.includes('Android');

  return (
    <div
      className="line-stack"
      style={{
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: mode === 'navigating' ? 'center' : 'flex-end',
        maxHeight: '100%',
        lineHeight: isFullscreen ? '1.2' : isAndroid ? '1.3' : '1.5',
        gap: '0',
        padding: '0',
        margin: '0',
        paddingBottom: '0',
        marginBottom: '0',
      }}
    >
      {visibleLines.map(({ line, index }) => {
        const ElementType = resolveElementType(line);
        const elementKey = index;

        // Hervorhebung der zuletzt aktiven Zeile
        const isLastActive =
          index === visibleLines.length - 1 && mode === 'typing';
        const lastActiveStyle = isLastActive
          ? {
              fontWeight: 500,
              backgroundColor: darkMode
                ? 'rgba(255,255,255,0.05)'
                : 'rgba(0,0,0,0.02)',
              borderRadius: '2px',
            }
          : {};

        if (ElementType === 'hr') {
          return (
            <hr
              key={elementKey}
              data-line-index={index}
              style={{ margin: '0' }}
            />
          );
        }

        // Klassennamen für Textfarbe
        const lineClassName = darkMode ? 'text-gray-200' : 'text-[#222]';

        // Content ermitteln
        const content: string | React.ReactNode =
          (line as any).html ??
          (line as any).text ??
          (line as any).raw ??
          (line as any).content ??
          '';

        return (
          <div
            key={elementKey}
            ref={(el: HTMLDivElement | null) => {
              lineRefs.current[index] = el;
            }}
            data-line-index={index}
            className={lineClassName}
            style={{ margin: '0', padding: '0', ...lastActiveStyle }}
            {...(typeof content === 'string'
              ? { dangerouslySetInnerHTML: { __html: content } }
              : {})}
          >
            {typeof content !== 'string' ? content : null}
          </div>
        );
      })}
    </div>
  );
});
