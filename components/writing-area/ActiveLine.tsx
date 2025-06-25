'use client';

import React, {
  useEffect,
  useState,
  useCallback,
  ChangeEvent,
  KeyboardEvent,
} from 'react';
import { getActiveLineTextClass } from '../../utils/lineClassUtils';

type Props = {
  activeLine: string;
  darkMode: boolean;
  fontSize: number;
  showCursor: boolean;
  maxCharsPerLine: number;
  hiddenInputRef: React.RefObject<HTMLTextAreaElement>;
  handleChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  handleKeyDown: (e: KeyboardEvent<HTMLTextAreaElement>) => void;
  activeLineRef: React.RefObject<HTMLDivElement>;
  isAndroid?: boolean;
  isFullscreen?: boolean;
};

/** Sichtbare Eingabezeile + unsichtbare Textarea */
export function ActiveLine(props: Props) {
  const {
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
  } = props;

  const [cursorPos, setCursorPos] = useState(activeLine.length);

  /* -------- Fokus & Cursor-Sync -------- */
  useEffect(
    () => hiddenInputRef.current?.focus({ preventScroll: true }),
    [hiddenInputRef, isAndroid],
  );

  useEffect(() => {
    const ta = hiddenInputRef.current;
    if (!ta) return;
    const update = () => setCursorPos(ta.selectionStart ?? activeLine.length);
    ta.addEventListener('input', update);
    ta.addEventListener('select', update);
    ta.addEventListener('keyup', update);
    return () => {
      ta.removeEventListener('input', update);
      ta.removeEventListener('select', update);
      ta.removeEventListener('keyup', update);
    };
  }, [activeLine, hiddenInputRef]);

  const refocus = useCallback(() => {
    setTimeout(() => hiddenInputRef.current?.focus(), 0);
  }, [hiddenInputRef]);

  const textClass = getActiveLineTextClass(darkMode);

  return (
    <div
      ref={activeLineRef}
      className={`fixed bottom-0 left-0 right-0 font-serif border-t z-50
        ${
          darkMode
            ? 'bg-gray-800 border-gray-700'
            : 'bg-[#f3efe9] border-[#e0dcd3]'
        }`}
      style={{
        height: `${fontSize * (isAndroid || isFullscreen ? 2.2 : 2.4)}px`,
        padding: `${isAndroid || isFullscreen ? 0.5 : 0.75}rem 1.25rem`,
      }}
      onClick={() => hiddenInputRef.current?.focus()}
    >
      {/* gerenderter Text + Cursor */}
      <div
        className={`relative pl-3 ${textClass} pointer-events-none`}
        style={{ fontSize, lineHeight: 1.2 }}
        aria-hidden
      >
        {activeLine.slice(0, cursorPos)}
        <span
          className={`inline-block h-[1.2em] ml-[1px] align-middle ${
            showCursor
              ? darkMode
                ? 'border-r-2 border-gray-200'
                : 'border-r-2 border-[#222]'
              : 'border-transparent'
          } animate-pulse`}
        />
        {activeLine.slice(cursorPos)}
      </div>

      {/* unsichtbare Eingabe */}
      <textarea
        ref={hiddenInputRef}
        value={activeLine}
        onChange={(e) => {
          handleChange(e);
          refocus();
        }}
        onKeyDown={(e) => {
          handleKeyDown(e);
          refocus();
        }}
        className="absolute inset-0 w-full h-full bg-transparent text-transparent caret-transparent outline-none resize-none overflow-hidden"
        style={{ fontSize, lineHeight: 1.2, fontFamily: 'serif' }}
        autoFocus
      />

      {/* Progress-Bar */}
      <div className={`${darkMode ? 'bg-gray-700' : 'bg-[#e2dfda]'} h-1`}>
        <div
          className={`${
            activeLine.length > maxCharsPerLine * 0.9
              ? 'bg-amber-500'
              : activeLine.length > maxCharsPerLine * 0.7
              ? 'bg-green-500'
              : darkMode
              ? 'bg-gray-500'
              : 'bg-[#bbb]'
          }
            h-full transition-all duration-75`}
          style={{
            width: `${Math.min(
              (activeLine.length / maxCharsPerLine) * 100,
              100,
            )}%`,
          }}
        />
      </div>
    </div>
  );
}
