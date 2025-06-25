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

export const LineStack = memo(function LineStack({
  visibleLines,
  lineRefs,
  darkMode,
  stackFontSize,
  mode,
  fontSize,
  paragraphRanges,
  selectedLineIndex,
  isFullscreen = false,
}: LineStackProps) {
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
      {visibleLines.map(({ line, index, key }) => {
        const elementKey = key || index;
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

        return (
          <div
            key={elementKey}
            ref={(el) => (lineRefs.current[index] = el)}
            className={`whitespace-pre-wrap break-words mb-2 font-serif ${
              darkMode ? 'text-gray-200' : 'text-gray-800'
            }`}
            data-line-index={index}
            style={{ margin: '0', padding: '0', ...lastActiveStyle }}
          >
            {line.text}
          </div>
        );
      })}
    </div>
  );
});
