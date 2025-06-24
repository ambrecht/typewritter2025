'use client';

import type React from 'react';
import { useState, useEffect, useCallback } from 'react';
import {
  AlignLeft,
  FileText,
  Fullscreen,
  Settings,
  Moon,
  Sun,
  Copy,
  Minimize2,
  Save,
  Download,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTypewriterStore } from '@/store/typewriter-store';
import { useKeyboard } from '@/hooks/use-keyboard';

interface ControlBarProps {
  wordCount: number;
  pageCount: number;
  toggleFullscreen: () => void;
  hiddenInputRef: React.RefObject<HTMLTextAreaElement | null>;
  isFullscreen?: boolean;
  openSettings: () => void;
}

interface ControlButton {
  icon: React.ReactElement;
  label: string;
  action: (e: React.MouseEvent) => void | Promise<void>;
  aria: string;
  disabled?: boolean;
  className?: string;
}

// Helper to detect touch-capable devices
function detectTouchDevice() {
  return (
    typeof window !== 'undefined' &&
    ('ontouchstart' in window || navigator.maxTouchPoints > 0)
  );
}

export default function ControlBar({
  wordCount,
  pageCount,
  toggleFullscreen,
  hiddenInputRef,
  isFullscreen = false,
  openSettings,
}: ControlBarProps) {
  const {
    darkMode,
    toggleDarkMode,
    lines,
    activeLine,
    saveSession,
    loadLastSession,
    isSaving,
    isLoading,
    resetSession,
  } = useTypewriterStore();

  const [isCompactView, setIsCompactView] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const [isTouchDeviceState, setIsTouchDevice] = useState(false);
  const [isVeryNarrowScreen, setIsVeryNarrowScreen] = useState(false);

  // Keyboard hook
  const { hideKeyboard, showKeyboard } = useKeyboard({
    inputRef: hiddenInputRef,
    isAndroid,
  });

  // Device & viewport detection
  useEffect(() => {
    const isAndroidDevice = /Android/.test(navigator.userAgent);
    setIsAndroid(isAndroidDevice);
    setIsTouchDevice(detectTouchDevice());

    const handleResize = () => {
      setIsCompactView(window.innerWidth < 640);
      setIsSmallScreen(window.innerWidth < 768 || isAndroidDevice);
      setIsVeryNarrowScreen(
        window.innerWidth < 400 && window.innerHeight > window.innerWidth,
      );
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Refocus input after actions
  const refocusInput = useCallback(() => {
    setTimeout(() => {
      if (isAndroid) {
        if (hiddenInputRef.current) {
          const ta = hiddenInputRef.current;
          ta.focus();
          ta.setSelectionRange(ta.value.length, ta.value.length);
        }
      } else {
        showKeyboard();
      }
    }, 150);
  }, [isAndroid, hiddenInputRef, showKeyboard]);

  // Copy to clipboard
  const copyToClipboard = () => {
    const fullText = [...lines.map((l) => l.text), activeLine].join('\n');
    if (navigator.clipboard?.writeText) {
      navigator.clipboard
        .writeText(fullText)
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
          refocusInput();
        })
        .catch(() => fallbackCopy(fullText));
    } else {
      fallbackCopy(fullText);
    }
  };

  const fallbackCopy = (text: string) => {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      refocusInput();
    } catch {
      /* ignore */
    }
  };

  // Handlers
  const handleOpenSettings = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    hideKeyboard();
    openSettings();
  };
  const handleSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await saveSession();
    refocusInput();
  };
  const handleLoad = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await loadLastSession();
    refocusInput();
  };
  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm('Möchten Sie wirklich alle Zeilen löschen?')) {
      resetSession();
      refocusInput();
    }
  };

  // Button styling
  const buttonSize: 'sm' | 'default' | 'lg' | 'icon' = isVeryNarrowScreen
    ? 'icon'
    : 'sm';
  const touchSize =
    isTouchDeviceState || isAndroid || isVeryNarrowScreen
      ? 'min-h-[44px] min-w-[44px]'
      : '';
  const buttonClass = `${
    darkMode
      ? 'bg-gray-700 hover:bg-gray-600 text-gray-200'
      : 'bg-[#d3d0cb] hover:bg-[#c4c1bc] text-[#222]'
  } font-serif ${touchSize}`;

  // Define buttons with typed interface
  const primaryButtons: ControlButton[] = [
    {
      icon: <Copy className="h-4 w-4" />,
      label: copied ? 'Kopiert!' : 'Kopieren',
      action: copyToClipboard,
      aria: 'Kopieren',
    },
    {
      icon: <Save className={`h-4 w-4 ${isSaving ? 'animate-pulse' : ''}`} />,
      label: isSaving ? 'Speichern...' : 'Speichern',
      action: handleSave,
      disabled: isSaving,
      aria: 'Speichern',
    },
    {
      icon: (
        <Download className={`h-4 w-4 ${isLoading ? 'animate-pulse' : ''}`} />
      ),
      label: isLoading ? 'Laden...' : 'Laden',
      action: handleLoad,
      disabled: isLoading,
      aria: 'Letzte Sitzung laden',
    },
  ];

  const secondaryButtons: ControlButton[] = [
    {
      icon: <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />,
      label: 'Löschen',
      action: handleDelete,
      className: 'hover:bg-red-100 dark:hover:bg-red-900',
      aria: 'Alle Zeilen löschen',
    },
    {
      icon: isFullscreen ? (
        <Minimize2 className="h-4 w-4" />
      ) : (
        <Fullscreen className="h-4 w-4" />
      ),
      label: isFullscreen ? 'Vollbild beenden' : 'Vollbild',
      action: () => {
        toggleFullscreen();
        setTimeout(refocusInput, 300);
      },
      aria: isFullscreen ? 'Vollbild beenden' : 'Vollbild',
    },
    {
      icon: darkMode ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      ),
      label: darkMode ? 'Hellmodus' : 'Dunkelmodus',
      action: toggleDarkMode,
      aria: darkMode
        ? 'Zum hellen Modus wechseln'
        : 'Zum dunklen Modus wechseln',
    },
    {
      icon: <Settings className="h-4 w-4" />,
      label: 'Einstellungen',
      action: handleOpenSettings,
      aria: 'Einstellungen',
    },
  ];

  // Render a group of buttons (Icon + optional label)
  const renderButtonGroup = (buttons: ControlButton[], showLabels = true) => (
    <div className={`flex ${isVeryNarrowScreen ? 'gap-1' : 'gap-2'}`}>
      {buttons.map((btn, i) => (
        <Button
          key={i}
          variant="outline"
          size={buttonSize}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            btn.action(e);
          }}
          disabled={btn.disabled}
          className={`${buttonClass} ${btn.className || ''}`}
          aria-label={btn.aria}
          title={btn.aria}
        >
          {btn.icon}
          {showLabels && !isSmallScreen && (
            <span className="ml-1">{btn.label}</span>
          )}
        </Button>
      ))}
    </div>
  );

  // Mobile‐only Icon row for very narrow portrait phones
  if (isVeryNarrowScreen) {
    return (
      <div
        className={`w-full px-2 pt-1 pb-1 text-sm font-serif ${
          darkMode ? 'bg-gray-900 text-gray-200' : 'bg-[#f3efe9] text-[#222]'
        }`}
        style={{ maxWidth: '100vw' }}
      >
        <div className="flex flex-wrap justify-center items-center gap-1">
          {[...primaryButtons, ...secondaryButtons].map((btn, i) => (
            <Button
              key={i}
              variant="outline"
              size="icon"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                btn.action(e);
              }}
              disabled={btn.disabled}
              className={`${buttonClass} p-2 h-9 w-9 ${btn.className || ''}`}
              aria-label={btn.aria}
              title={btn.aria}
            >
              {btn.icon}
            </Button>
          ))}
        </div>
      </div>
    );
  }

  // Desktop & Tablet: original layout with stats + buttons
  return (
    <div
      className={`flex items-center justify-between p-2 sm:p-3 text-sm font-serif gap-2 ${
        darkMode ? 'text-gray-200 bg-gray-900' : 'text-[#222] bg-[#f3efe9]'
      }`}
    >
      {/* Statistics */}
      <div
        className={`flex items-center gap-2 sm:gap-6 ${
          isSmallScreen ? 'w-full justify-center' : ''
        }`}
      >
        <div className="flex items-center gap-1 sm:gap-2">
          <AlignLeft
            className={`h-4 w-4 ${
              darkMode ? 'text-gray-400' : 'text-gray-600'
            }`}
          />
          <span className="whitespace-nowrap">
            {isCompactView ? wordCount : `Wörter: ${wordCount}`}
          </span>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <FileText
            className={`h-4 w-4 ${
              darkMode ? 'text-gray-400' : 'text-gray-600'
            }`}
          />
          <span className="whitespace-nowrap">
            {isCompactView ? pageCount : `Seiten: ${pageCount}`}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2">
        {renderButtonGroup(primaryButtons)}
        {renderButtonGroup(secondaryButtons)}
      </div>
    </div>
  );
}
