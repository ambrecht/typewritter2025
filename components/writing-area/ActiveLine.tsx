'use client';

import React, {
  useEffect,
  useState,
  useCallback,
  ChangeEvent,
  KeyboardEvent,
} from 'react';
import { getActiveLineTextClass } from '../../utils/lineClassUtils';

interface ActiveLineProps {
  activeLine: string;
  darkMode: boolean;
  fontSize: number;
  showCursor: boolean;
  maxCharsPerLine: number;
  hiddenInputRef: React.RefObject<HTMLTextAreaElement | null>;
  handleChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  handleKeyDown: (e: KeyboardEvent<HTMLTextAreaElement>) => void;
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
  // --- Debug State ---
  const [cursorPos, setCursorPos] = useState<number>(activeLine.length);
  const [focused, setFocused] = useState<boolean>(true);
  const [logs, setLogs] = useState<string[]>([]);

  const appendLog = (msg: string) => {
    setLogs((prev) => {
      const next = [...prev, `${new Date().toLocaleTimeString()}: ${msg}`];
      return next.slice(-10);
    });
    console.debug(msg);
  };

  // --- Keep textarea focused ---
  useEffect(() => {
    const ta = hiddenInputRef.current;
    if (ta) {
      ta.focus({ preventScroll: true });
      appendLog('textarea.focus()');
    }
  }, [isAndroid, hiddenInputRef]);

  // --- Cursor & Focus Tracking ---
  useEffect(() => {
    const ta = hiddenInputRef.current;
    if (!ta) return;

    const update = () => {
      const pos = ta.selectionStart ?? activeLine.length;
      setCursorPos(pos);
      appendLog(`updateCursor: pos=${pos}`);
    };
    const onF = () => {
      setFocused(true);
      appendLog('onFocus');
    };
    const onB = () => {
      setFocused(false);
      appendLog('onBlur');
    };

    ta.addEventListener('focus', onF);
    ta.addEventListener('blur', onB);
    ta.addEventListener('input', update);
    ta.addEventListener('select', update);
    ta.addEventListener('keyup', update);

    return () => {
      ta.removeEventListener('focus', onF);
      ta.removeEventListener('blur', onB);
      ta.removeEventListener('input', update);
      ta.removeEventListener('select', update);
      ta.removeEventListener('keyup', update);
    };
  }, [activeLine, hiddenInputRef]);

  // --- Refocus after key events ---
  const refocus = useCallback(() => {
    setTimeout(() => {
      const ta = hiddenInputRef.current;
      if (ta) {
        ta.focus();
        ta.setSelectionRange(ta.value.length, ta.value.length);
        appendLog('refocus() & setSelectionRange');
      }
    }, 50);
  }, [hiddenInputRef]);

  const containerClass = `fixed bottom-0 left-0 right-0 font-serif border-t z-50 ${
    darkMode
      ? 'bg-gray-800 border-gray-700 shadow-[0_-8px_16px_rgba(0,0,0,0.3)]'
      : 'bg-[#f3efe9] border-[#e0dcd3] shadow-[0_-8px_16px_rgba(0,0,0,0.2)]'
  }`;
  const textClass = getActiveLineTextClass(darkMode);

  return (
    <div
      ref={activeLineRef}
      className={containerClass}
      style={{
        height:
          isFullscreen || isAndroid
            ? `${fontSize * 2.2}px`
            : `${fontSize * 2.4}px`,
        padding:
          isFullscreen || isAndroid ? '0.5rem 1.25rem' : '0.75rem 1.25rem',
        marginTop: 0,
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
      onClick={() => {
        hiddenInputRef.current?.focus();
        appendLog('container onClick → focus');
      }}
    >
      {/* Debug Panel */}
      <div
        className="absolute top-0 left-0 right-0 p-2 text-xs bg-black bg-opacity-50 text-white font-mono max-h-32 overflow-auto z-50"
        style={{ pointerEvents: 'none' }}
      >
        <div>activeLine: "{activeLine}"</div>
        <div>cursorPos: {cursorPos}</div>
        <div>focused: {`${focused}`}</div>
        <div>isAndroid: {`${isAndroid}`}</div>
        <div>selectionStart: {hiddenInputRef.current?.selectionStart}</div>
        <div>── Logs ──</div>
        {logs.map((l, i) => (
          <div key={i}>{l}</div>
        ))}
      </div>

      {/* Visual Cue Dot */}
      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
        <div
          className={`h-3 w-3 rounded-full ${
            darkMode ? 'bg-blue-500' : 'bg-amber-500'
          } opacity-70`}
        />
      </div>

      {/* Rendered Text + Cursor */}
      <div
        className={`relative pl-3 ${textClass} pointer-events-none`}
        style={{ fontSize: `${fontSize}px`, lineHeight: 1.2 }}
        aria-hidden="true"
      >
        {activeLine.slice(0, cursorPos)}
        <span
          className={`inline-block h-[1.2em] ml-[1px] align-middle ${
            showCursor && focused
              ? darkMode
                ? 'border-r-2 border-gray-200'
                : 'border-r-2 border-[#222]'
              : 'border-r-2 border-transparent'
          }`}
          style={{
            transform: 'translateY(-0.1em)',
            animation: showCursor && focused ? 'pulse 1.5s infinite' : 'none',
          }}
        />
        {activeLine.slice(cursorPos)}
      </div>

      {/* Invisible Textarea */}
      <textarea
        ref={hiddenInputRef}
        value={activeLine}
        onChange={(e) => {
          handleChange(e);
          appendLog(`onChange: "${e.target.value}"`);
          refocus();
        }}
        onKeyDown={(e) => {
          handleKeyDown(e);
          appendLog(`onKeyDown: key="${e.key}"`);
          refocus();
        }}
        className="absolute inset-0 w-full h-full bg-transparent text-transparent caret-transparent outline-none resize-none overflow-hidden"
        style={{
          fontSize: `${fontSize}px`,
          lineHeight: 1.2,
          fontFamily: 'serif',
        }}
        autoFocus
        aria-label="Typewriter input field"
      />

      {/* Progress Bar */}
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

      {/* Character Counter */}
      <div className="absolute bottom-1 right-4 text-xs opacity-60 pointer-events-none">
        {activeLine.length}/{maxCharsPerLine}
      </div>
    </div>
  );
}
