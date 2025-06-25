'use client';

import type React from 'react';
import { useEffect, useState, useRef } from 'react';
import type { LineBreakConfig, ParagraphRange, FormattedLine } from '@/types';

// Importiere Hooks
import { useContainerDimensions } from '../../hooks/useContainerDimensions';
import { useKeyboardHandling } from '../../hooks/useKeyboardHandling';
import { useVisibleLines } from '../../hooks/useVisibleLines';

// Importiere Komponenten
import { CopyButton } from './CopyButton';
import { NavigationHint } from './NavigationHint';
import { LineStack } from './LineStack';
import { ActiveLine } from './ActiveLine';

const DEFAULT_LINE_BREAK_CONFIG: LineBreakConfig = {
  maxCharsPerLine: 56,
  autoMaxChars: true, // Standardmäßig aktiviert
};

interface WritingAreaProps {
  lines: FormattedLine[];
  activeLine: string;
  activeLineType: string;
  setActiveLine: (line: string) => void;
  addLineToStack: () => void;
  maxCharsPerLine: number;
  fontSize: number;
  stackFontSize: number;
  hiddenInputRef: React.RefObject<HTMLTextAreaElement | null>;
  showCursor: boolean;
  lineBreakConfig?: LineBreakConfig;
  darkMode: boolean;
  paragraphRanges: ParagraphRange[];
  inParagraph: boolean;
  mode: 'typing' | 'navigating';
  selectedLineIndex: number | null;
  isFullscreen: boolean;
  linesContainerRef?: React.RefObject<HTMLDivElement>;
}

/**
 * WritingArea-Komponente, die den Schreibbereich darstellt
 * Implementiert eine strikte Onescreen-Ansicht ohne Scrollbalken
 */
export default function WritingArea({
  lines,
  activeLine,
  activeLineType,
  setActiveLine,
  addLineToStack,
  maxCharsPerLine,
  fontSize,
  stackFontSize,
  hiddenInputRef,
  showCursor,
  lineBreakConfig = DEFAULT_LINE_BREAK_CONFIG,
  darkMode,
  paragraphRanges,
  inParagraph,
  mode,
  selectedLineIndex,
  isFullscreen,
  linesContainerRef: externalLinesContainerRef,
}: WritingAreaProps) {
  // Verwende Hooks für Container-Dimensionen
  const {
    linesContainerRef: internalLinesContainerRef,
    activeLineRef,
    lineRefs,
    maxVisibleLines,
  } = useContainerDimensions(stackFontSize);

  // Verwende den externen Ref, wenn vorhanden, sonst den internen
  const linesContainerRef =
    externalLinesContainerRef || internalLinesContainerRef;

  // Verwende Hooks für Tastatureingaben
  const { handleChange, handleKeyDown } = useKeyboardHandling({
    setActiveLine,
    addLineToStack,
    lineBreakConfig,
    hiddenInputRef,
    linesContainerRef,
  });

  // Berechne die sichtbaren Zeilen - der Hook gibt jetzt direkt das Ergebnis zurück
  const visibleLines = useVisibleLines(
    lines,
    maxVisibleLines,
    mode,
    selectedLineIndex,
    isFullscreen,
  );

  // State für die Container-Höhe
  const [containerHeight, setContainerHeight] = useState(0);

  // Ref für die letzte Neuberechnung
  const lastRecalculation = useRef(Date.now());

  // Messe die Container-Höhe
  useEffect(() => {
    if (!linesContainerRef.current) return;

    const updateHeight = () => {
      const height = linesContainerRef.current?.clientHeight || 0;
      if (Math.abs(height - containerHeight) > 5) {
        // Nur bei signifikanter Änderung aktualisieren
        setContainerHeight(height);
      }
    };

    updateHeight();

    const resizeObserver = new ResizeObserver(updateHeight);
    resizeObserver.observe(linesContainerRef.current);

    return () => {
      if (linesContainerRef.current) {
        resizeObserver.unobserve(linesContainerRef.current);
      }
      resizeObserver.disconnect();
    };
  }, [linesContainerRef, containerHeight, isFullscreen]);

  // Initialisiere die Refs für jede Zeile
  useEffect(() => {
    lineRefs.current = lineRefs.current.slice(0, lines.length);
  }, [lines, lineRefs]);

  // Verbesserte Scroll-Logik für alle Geräte
  useEffect(() => {
    // Nur im Typing-Modus
    if (mode !== 'typing' || !linesContainerRef.current) return;

    // Funktion zum Scrollen zum Ende des Containers
    const scrollToBottom = () => {
      if (linesContainerRef.current) {
        // Finde das letzte Element im Container
        const elements =
          linesContainerRef.current.querySelectorAll('[data-line-index]');
        const lastElement = elements[elements.length - 1];

        // Wenn ein Element gefunden wurde, scrolle zu ihm
        if (lastElement) {
          lastElement.scrollIntoView({ behavior: 'auto', block: 'end' });
        } else {
          // Fallback: Scrolle zum Ende des Containers
          linesContainerRef.current.scrollTop =
            linesContainerRef.current.scrollHeight;
        }
      }
    };

    // Scroll sofort und nach einer kurzen Verzögerung (für Rendering-Probleme)
    scrollToBottom();
    const timeoutId = setTimeout(scrollToBottom, 50);

    // Nochmals nach einer längeren Verzögerung (für langsame Geräte)
    const longTimeoutId = setTimeout(scrollToBottom, 300);

    return () => {
      clearTimeout(timeoutId);
      clearTimeout(longTimeoutId);
    };
  }, [lines.length, mode, linesContainerRef]);

  // Berechne die Höhe des aktiven Zeilenbereichs
  // Reduziere die Höhe für Android und im Vollbildmodus
  const activeLineHeight =
    isFullscreen || navigator.userAgent.includes('Android')
      ? fontSize * 1.8 + 16 // Stark reduzierte Höhe für Vollbildmodus und Android
      : fontSize * 2.0 + 24; // Reduzierte Standard-Höhe

  // Neuberechnung bei Änderung des Vollbildmodus
  useEffect(() => {
    // Verhindere zu häufige Neuberechnungen
    const now = Date.now();
    if (now - lastRecalculation.current < 300) return;
    lastRecalculation.current = now;

    // Verzögere die Neuberechnung, um sicherzustellen, dass der Vollbildmodus vollständig aktiviert ist
    const timeoutId = setTimeout(() => {
      if (linesContainerRef.current) {
        // Erzwinge ein Layout-Update
        linesContainerRef.current.style.display = 'none';
        void linesContainerRef.current.offsetHeight; // Trigger reflow
        linesContainerRef.current.style.display = 'flex';
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [isFullscreen, linesContainerRef]);

  // Prüfe, ob es sich um ein Android-Gerät handelt
  const isAndroid =
    typeof navigator !== 'undefined' && navigator.userAgent.includes('Android');

  return (
    <div
      className="flex-1 flex flex-col relative"
      style={{ overflow: 'hidden' }}
    >
      {/* Kopier-Button für den gesamten Text */}
      <CopyButton lines={lines} activeLine={activeLine} darkMode={darkMode} />

      {/* Pfeiltasten-Hinweis */}
      <NavigationHint darkMode={darkMode} />

      {/* Container für den Zeilenstack - WICHTIG: overflow-hidden verhindert Scrollbalken */}
      <div
        ref={linesContainerRef}
        className={`flex-1 px-6 pt-6 writing-container ${
          darkMode ? 'bg-gray-900 text-gray-200' : 'bg-[#fcfcfa] text-gray-800'
        } ${isFullscreen ? 'fullscreen-container' : ''}`}
        style={{
          fontSize: `${stackFontSize}px`,
          lineHeight: isFullscreen ? '1.2' : '1.3', // Reduzierter Zeilenabstand
          position: 'relative',
          overflow: 'hidden',
          height: '100%',
          // Reduziere den Padding im Vollbildmodus
          paddingTop: isFullscreen ? '0.5rem' : '1rem',
          // Wichtig: Padding-Bottom auf 0 setzen, um den Abstand zu eliminieren
          paddingBottom: '0',
        }}
        aria-live="polite"
        data-fullscreen={isFullscreen ? 'true' : 'false'}
      >
        {/* Zeilenstack-Komponente mit absoluter Positionierung */}
        <div
          className="line-stack-container"
          style={{
            position: 'absolute',
            bottom: '0', // Direkt am Boden des Containers
            left: '24px',
            right: '24px',
            // Maximale Höhe basierend auf Container-Höhe
            height: `${containerHeight}px`, // Nutze die volle Höhe
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end', // Wichtig: Immer am unteren Rand ausrichten
            // Füge etwas Abstand zum Schreibkopf hinzu
            paddingBottom: '8px', // Füge etwas Abstand hinzu
            margin: '0',
          }}
        >
          <LineStack
            visibleLines={visibleLines}
            lineRefs={lineRefs}
            darkMode={darkMode}
            stackFontSize={stackFontSize}
            mode={mode}
            fontSize={fontSize}
            paragraphRanges={paragraphRanges}
            selectedLineIndex={selectedLineIndex}
            isFullscreen={isFullscreen}
          />
        </div>
      </div>

      {/* Area for the active line with cursor - nur im Typing-Modus sichtbar */}
      {mode === 'typing' && (
        <ActiveLine
          activeLine={activeLine}
          activeLineType={activeLineType}
          darkMode={darkMode}
          fontSize={fontSize}
          showCursor={showCursor}
          inParagraph={inParagraph}
          maxCharsPerLine={maxCharsPerLine}
          hiddenInputRef={hiddenInputRef}
          handleChange={handleChange}
          handleKeyDown={handleKeyDown}
          activeLineRef={activeLineRef}
          isAndroid={isAndroid}
          isFullscreen={isFullscreen}
        />
      )}
    </div>
  );
}
