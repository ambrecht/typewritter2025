'use client';

import type React from 'react';

interface ActiveLineProps {
  activeLine: string;
  darkMode: boolean;
  fontSize: number;
  showCursor: boolean;
  maxCharsPerLine: number;
  hiddenInputRef: React.RefObject<HTMLTextAreaElement | null>;
  handleChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  activeLineRef: React.RefObject<HTMLDivElement>;
  isAndroid?: boolean;
  isFullscreen?: boolean;
}

/**
 * Eingabezeile am unteren Bildschirmrand (ohne Markdown‑Verarbeitung)
 */
export function ActiveLine({
  activeLine,
  darkMode,
  fontSize,
  showCursor,
  maxCharsPerLine,
  hiddenInputRef,
  handleChange,
  handleKeyDown,
  activeLineRef,
  isAndroid = false,
  isFullscreen = false,
}: ActiveLineProps) {
  // Grundlegendes Layout
  const fixedActiveLineClass = `fixed bottom-0 left-0 right-0 font-serif border-t z-50 active-line ${
    darkMode
      ? 'bg-gray-800 border-gray-700 shadow-[0_-8px_16px_rgba(0,0,0,0.3)]'
      : 'bg-[#f3efe9] border-[#e0dcd3] shadow-[0_-8px_16px_rgba(0,0,0,0.2)]'
  }`;

  const activeLineTextClass = `whitespace-pre ${
    darkMode ? 'text-gray-200' : 'text-[#222]'
  }`;

  return (
    <div
      ref={activeLineRef}
      className={fixedActiveLineClass}
      style={{
        height:
          isFullscreen || isAndroid
            ? `${fontSize * 2.2}px`
            : `${fontSize * 2.4}px`,
        paddingTop: isFullscreen || isAndroid ? '0.5rem' : '0.75rem',
        paddingBottom: isFullscreen || isAndroid ? '0.5rem' : '0.75rem',
        paddingLeft: '1.25rem',
        paddingRight: '1.25rem',
        marginTop: '0',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        background: darkMode
          ? 'linear-gradient(to bottom, rgba(31, 41, 55, 0.95), rgba(17, 24, 39, 0.98))'
          : 'linear-gradient(to bottom, rgba(243, 239, 233, 0.95), rgba(248, 245, 240, 0.98))',
        boxShadow: darkMode
          ? '0 -8px 20px rgba(0, 0, 0, 0.4)'
          : '0 -8px 20px rgba(0, 0, 0, 0.15)',
        borderTop: darkMode
          ? '2px solid rgba(55, 65, 81, 0.8)'
          : '2px solid rgba(214, 211, 205, 0.8)',
      }}
      data-testid="active-line"
    >
      <div className="relative">
        {/* Sichtbarer Text mit Blink‑Cursor */}
        <div
          className={activeLineTextClass}
          style={{ fontSize: `${fontSize}px`, lineHeight: '1.2' }}
          aria-hidden="true"
        >
          {activeLine}
          <span
            className={`inline-block h-[1.2em] ml-[1px] align-middle ${
              showCursor
                ? darkMode
                  ? 'border-r-2 border-gray-200 animate-pulse'
                  : 'border-r-2 border-[#222] animate-pulse'
                : 'border-r-2 border-transparent'
            }`}
            style={{ transform: 'translateY(-0.1em)' }}
          />
        </div>

        {/* Unsichtbares Textarea für Eingabe */}
        <textarea
          ref={hiddenInputRef}
          value={activeLine}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          className="w-full bg-transparent text-transparent caret-transparent outline-none resize-none overflow-hidden"
          style={{
            fontSize: `${fontSize}px`,
            lineHeight: '1.2',
            fontFamily: 'serif',
            height: `${fontSize * 1.2}px`,
          }}
          autoFocus
          aria-label="Typewriter input field"
        />
      </div>

      {/* Fortschrittsbalken für Zeilenlänge */}
      <div
        className={`absolute bottom-0 left-0 h-1 ${
          darkMode ? 'bg-gray-700' : 'bg-[#e2dfda]'
        } w-full`}
      >
        <div
          className={`h-full ${
            activeLine.length > maxCharsPerLine * 0.9
              ? 'bg-amber-500'
              : activeLine.length > maxCharsPerLine * 0.7
              ? 'bg-green-500'
              : darkMode
              ? 'bg-gray-500'
              : 'bg-[#bbb]'
          } transition-all duration-75`}
          style={{
            width: `${Math.min(
              (activeLine.length / maxCharsPerLine) * 100,
              100,
            )}%`,
          }}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={maxCharsPerLine}
          aria-valuenow={activeLine.length}
        />
      </div>

      {/* Zeichen‑Zähler */}
      <div className="absolute bottom-1 right-4 text-xs opacity-60">
        {activeLine.length}/{maxCharsPerLine}
      </div>
    </div>
  );
}
