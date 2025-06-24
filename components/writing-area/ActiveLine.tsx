'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { getActiveLineTextClass } from '../../utils/lineClassUtils';

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
  const fixedActiveLineClass = `fixed bottom-0 left-0 right-0 font-serif border-t z-50 active-line ${
    darkMode
      ? 'bg-gray-800 border-gray-700 shadow-[0_-8px_16px_rgba(0,0,0,0.3)]'
      : 'bg-[#f3efe9] border-[#e0dcd3] shadow-[0_-8px_16px_rgba(0,0,0,0.2)]'
  }`;

  const activeLineTextClass = getActiveLineTextClass(darkMode);
  const [cursorPosition, setCursorPosition] = useState(activeLine.length);
  const [isFocused, setIsFocused] = useState(true);

  // Keep textarea focused on Android
  useEffect(() => {
    if (isAndroid && hiddenInputRef.current) {
      hiddenInputRef.current.focus({ preventScroll: true });
    }
  }, [isAndroid, hiddenInputRef]);

  // Update cursor position and focus state
  useEffect(() => {
    const input = hiddenInputRef.current;
    if (!input) return;

    const updateCursor = () => {
      setCursorPosition(input.selectionStart ?? activeLine.length);
    };
    const onFocus = () => setIsFocused(true);
    const onBlur = () => setIsFocused(false);

    input.addEventListener('focus', onFocus);
    input.addEventListener('blur', onBlur);
    input.addEventListener('select', updateCursor);
    input.addEventListener('keyup', updateCursor);
    input.addEventListener('click', updateCursor);
    input.addEventListener('input', updateCursor);

    return () => {
      input.removeEventListener('focus', onFocus);
      input.removeEventListener('blur', onBlur);
      input.removeEventListener('select', updateCursor);
      input.removeEventListener('keyup', updateCursor);
      input.removeEventListener('click', updateCursor);
      input.removeEventListener('input', updateCursor);
    };
  }, [activeLine, hiddenInputRef]);

  // Refocus helper after actions
  const refocusInput = useCallback(() => {
    setTimeout(() => {
      const ta = hiddenInputRef.current;
      if (isAndroid && ta) {
        ta.focus();
        ta.setSelectionRange(ta.value.length, ta.value.length);
      }
    }, 150);
  }, [isAndroid, hiddenInputRef]);

  return (
    <div
      ref={activeLineRef}
      className={fixedActiveLineClass}
      onClick={() => hiddenInputRef.current?.focus()}
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
          ? 'linear-gradient(to bottom, rgba(31,41,55,0.95), rgba(17,24,39,0.98))'
          : 'linear-gradient(to bottom, rgba(243,239,233,0.95), rgba(248,245,240,0.98))',
        boxShadow: darkMode
          ? '0 -8px 20px rgba(0,0,0,0.4)'
          : '0 -8px 20px rgba(0,0,0,0.15)',
        borderTop: darkMode
          ? '2px solid rgba(55,65,81,0.8)'
          : '2px solid rgba(214,211,205,0.8)',
      }}
      data-testid="active-line"
    >
      <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
        <div
          className={`h-3 w-3 rounded-full ${
            darkMode ? 'bg-blue-500' : 'bg-amber-500'
          } opacity-70`}
        />
      </div>

      <div className="relative pl-3">
        <div
          className={activeLineTextClass}
          style={{ fontSize: `${fontSize}px`, lineHeight: '1.2' }}
          aria-hidden="true"
        >
          {activeLine.slice(0, cursorPosition)}
          <span
            className={`inline-block h-[1.2em] ml-[1px] align-middle ${
              showCursor && isFocused
                ? darkMode
                  ? 'border-r-2 border-gray-200'
                  : 'border-r-2 border-[#222]'
                : 'border-r-2 border-transparent'
            }`}
            style={{
              transform: 'translateY(-0.1em)',
              animation:
                showCursor && isFocused ? 'pulse 1.5s infinite' : 'none',
            }}
          />
          {activeLine.slice(cursorPosition)}
        </div>

        <textarea
          ref={hiddenInputRef}
          value={activeLine}
          onChange={handleChange}
          onKeyDown={(e) => {
            handleKeyDown(e);
            refocusInput();
          }}
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

      <div className="absolute bottom-1 right-4 text-xs opacity-60">
        {activeLine.length}/{maxCharsPerLine}
      </div>
    </div>
  );
}
