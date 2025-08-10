"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Type as Aa, Target, Timer, Cloud, FileText, MoreHorizontal, Loader2, Sun, Moon } from "lucide-react"
import * as Popover from "@radix-ui/react-popover"
import * as Accordion from "@radix-ui/react-accordion"
import { useTypewriterStore } from "@/store/typewriter-store"
import { useFocusTimerStore } from "@/store/focus-timer-store"

interface ToolbarProps extends React.HTMLAttributes<HTMLDivElement> {}

const Toolbar = React.forwardRef<HTMLDivElement, ToolbarProps>(({ className, ...props }, ref) => {
  const {
    fontSize,
    stackFontSize,
    setFontSize,
    setStackFontSize,
    saveSession,
    cancelSave,
    lastSaveStatus,
    isSaving,
    darkMode,
    toggleDarkMode,
    statistics,
  } = useTypewriterStore()

  const { running, endTime, start, stop } = useFocusTimerStore()
  const [remaining, setRemaining] = useState(0)

  useEffect(() => {
    if (!running) return
    const update = () => {
      const r = Math.max(0, endTime - Date.now())
      setRemaining(r)
      if (r <= 0) stop()
    }
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [running, endTime, stop])

  const badge = () => {
    if (isSaving) return <Loader2 className="h-3 w-3 animate-spin" />
    if (lastSaveStatus && !lastSaveStatus.success) return <span className="text-red-600">●!</span>
    return <span className="text-green-600">●</span>
  }

  const increaseFont = () => {
    setFontSize(fontSize + 1)
    setStackFontSize(stackFontSize + 1)
  }
  const decreaseFont = () => {
    setFontSize(Math.max(8, fontSize - 1))
    setStackFontSize(Math.max(8, stackFontSize - 1))
  }

  const formattedRemaining = () => {
    const total = Math.floor(remaining / 1000)
    const m = String(Math.floor(total / 60)).padStart(2, "0")
    const s = String(total % 60).padStart(2, "0")
    return `${m}:${s}`
  }

  return (
    <div
      ref={ref}
      className={cn(
        "w-screen flex items-center gap-2 px-2 border-b border-neutral-200 dark:border-neutral-800 bg-[#f3efe9] dark:bg-neutral-900",
        className,
      )}
      {...props}
    >
      {/* Font options */}
      <Popover.Root modal>
        <Popover.Trigger asChild>
          <Button size="icon" variant="ghost" aria-label="Schriftgröße" title="Schriftgröße">
            <Aa className="h-4 w-4" />
          </Button>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            side="bottom"
            className="z-50 w-[20rem] max-w-[26rem] max-h-[70svh] rounded-md bg-white dark:bg-neutral-800 p-4 shadow-md outline-none"
            role="dialog"
            aria-modal="true"
            aria-labelledby="font-panel-title"
          >
            <h2 id="font-panel-title" className="text-sm font-semibold mb-2">
              Schriftgröße
            </h2>
            <div className="flex gap-2">
              <Button onClick={increaseFont} aria-label="Größer">
                +
              </Button>
              <Button onClick={decreaseFont} aria-label="Kleiner">
                -
              </Button>
            </div>
            <Accordion.Root type="single" collapsible className="mt-4">
              <Accordion.Item value="advanced">
                <Accordion.Trigger className="text-sm font-medium">
                  Weitere Optionen
                </Accordion.Trigger>
                <Accordion.Content className="pt-2 text-sm">
                  Keine weiteren Optionen verfügbar.
                </Accordion.Content>
              </Accordion.Item>
            </Accordion.Root>
            <Popover.Close asChild>
              <Button className="mt-4" variant="outline">
                Schließen
              </Button>
            </Popover.Close>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>

      {/* Focus timer */}
      <Popover.Root modal>
        <Popover.Trigger asChild>
          <Button size="icon" variant="ghost" aria-label="Fokus-Timer" title="Fokus-Timer">
            {running ? <Timer className="h-4 w-4" /> : <Target className="h-4 w-4" />}
          </Button>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            side="bottom"
            className="z-50 w-[20rem] max-w-[26rem] max-h-[70svh] rounded-md bg-white dark:bg-neutral-800 p-4 shadow-md outline-none"
            role="dialog"
            aria-modal="true"
            aria-labelledby="timer-panel-title"
          >
            <h2 id="timer-panel-title" className="text-sm font-semibold mb-2">
              Fokus-Timer
            </h2>
            {running ? (
              <div className="flex items-center gap-2">
                <span className="font-mono text-lg">{formattedRemaining()}</span>
                <Button onClick={stop}>Stop</Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Button onClick={() => start(25)}>25 min</Button>
                <Button onClick={() => start(5)}>5 min</Button>
              </div>
            )}
            <Popover.Close asChild>
              <Button className="mt-4" variant="outline">
                Schließen
              </Button>
            </Popover.Close>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>

      {/* Cloud sync */}
      <Popover.Root modal>
        <Popover.Trigger asChild>
          <Button
            size="icon"
            variant="ghost"
            aria-label="Cloud-Sync"
            title="Cloud-Sync"
            className="relative"
          >
            <Cloud className="h-4 w-4" />
            <span className="absolute -top-1 -right-1 text-xs" aria-live="polite">
              {badge()}
            </span>
          </Button>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            side="bottom"
            className="z-50 w-[20rem] max-w-[26rem] max-h-[70svh] rounded-md bg-white dark:bg-neutral-800 p-4 shadow-md outline-none"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cloud-panel-title"
          >
            <h2 id="cloud-panel-title" className="text-sm font-semibold mb-2">
              Synchronisation
            </h2>
            {lastSaveStatus && !lastSaveStatus.success && (
              <div className="mb-2 rounded bg-red-100 text-red-700 p-2">
                {lastSaveStatus.message}
              </div>
            )}
            {isSaving ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Speichert...</span>
                <Button onClick={cancelSave} variant="outline" className="ml-auto">
                  Abbrechen
                </Button>
              </div>
            ) : (
              <Button onClick={saveSession}>Jetzt synchronisieren</Button>
            )}
            <Popover.Close asChild>
              <Button className="mt-4" variant="outline">
                Schließen
              </Button>
            </Popover.Close>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>

      {/* Document */}
      <Popover.Root modal>
        <Popover.Trigger asChild>
          <Button size="icon" variant="ghost" aria-label="Dokument" title="Dokument">
            <FileText className="h-4 w-4" />
          </Button>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            side="bottom"
            className="z-50 w-[20rem] max-w-[26rem] max-h-[70svh] rounded-md bg-white dark:bg-neutral-800 p-4 shadow-md outline-none"
            role="dialog"
            aria-modal="true"
            aria-labelledby="doc-panel-title"
          >
            <h2 id="doc-panel-title" className="text-sm font-semibold mb-2">
              Dokument
            </h2>
            <div className="text-sm mb-2">
              Wörter: {statistics.wordCount} – Seiten: {statistics.pageCount}
            </div>
            <Popover.Close asChild>
              <Button className="mt-4" variant="outline">
                Schließen
              </Button>
            </Popover.Close>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>

      {/* More */}
      <Popover.Root modal>
        <Popover.Trigger asChild>
          <Button
            size="icon"
            variant="ghost"
            aria-label="Weitere Optionen"
            title="Weitere Optionen"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            side="bottom"
            className="z-50 w-[20rem] max-w-[26rem] max-h-[70svh] rounded-md bg-white dark:bg-neutral-800 p-4 shadow-md outline-none"
            role="dialog"
            aria-modal="true"
            aria-labelledby="more-panel-title"
          >
            <h2 id="more-panel-title" className="text-sm font-semibold mb-2">
              Weitere Optionen
            </h2>
            <Button
              onClick={toggleDarkMode}
              className="flex items-center gap-2"
              variant="outline"
            >
              {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />} {" "}
              {darkMode ? "Hellmodus" : "Dunkelmodus"}
            </Button>
            <Popover.Close asChild>
              <Button className="mt-4" variant="outline">
                Schließen
              </Button>
            </Popover.Close>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </div>
  )
})

Toolbar.displayName = "Toolbar"

export default Toolbar

