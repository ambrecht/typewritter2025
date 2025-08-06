"use client"

import { useEffect, useState } from "react"
import { useTypewriterStore } from "@/store/typewriter-store"

export default function FlowModeOverlay() {
  const {
    flowMode,
    statistics,
    stopFlowMode,
    saveSession,
    updateFlowMode,
  } = useTypewriterStore()

  const [timeLeft, setTimeLeft] = useState(0)
  const [paused, setPaused] = useState(false)
  const [completed, setCompleted] = useState(false)

  useEffect(() => {
    if (!flowMode.enabled || flowMode.timerType !== "time" || paused) return

    const tick = () => {
      const elapsed = Date.now() - (flowMode.timerStartTime || Date.now())
      const remaining = flowMode.timerTarget * 60 * 1000 - elapsed
      setTimeLeft(remaining)
      if (remaining <= 0) {
        finish()
      }
    }

    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [flowMode, paused])

  useEffect(() => {
    if (!flowMode.enabled || flowMode.timerType !== "words") return
    const wordsWritten =
      statistics.wordCount - (flowMode.initialWordCount || statistics.wordCount)
    if (wordsWritten >= flowMode.timerTarget) {
      finish()
    }
  }, [statistics.wordCount, flowMode])

  const finish = async () => {
    if (completed) return
    await saveSession()
    stopFlowMode()
    setCompleted(true)
    setTimeout(() => setCompleted(false), 4000)
  }

  if (!flowMode.enabled && !completed) return null

  const minutes = Math.floor(timeLeft / 60000)
  const seconds = Math.floor((timeLeft % 60000) / 1000)
  const wordsWritten =
    statistics.wordCount - (flowMode.initialWordCount || statistics.wordCount)

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
      {completed ? (
        <div
          className="p-4 bg-green-600 text-white rounded font-serif"
          style={{ animation: "fadeout 3s forwards" }}
        >
          Great work! Flow complete.
        </div>
      ) : (
        <div
          className="flex items-center gap-3 p-3 rounded shadow-lg font-serif"
          style={{ background: "rgba(0,0,0,0.7)", color: "#fff" }}
        >
          {flowMode.timerType === "time" ? (
            <span>
              Zeit übrig: {minutes}:{seconds.toString().padStart(2, "0")}
            </span>
          ) : (
            <span>
              {wordsWritten} / {flowMode.timerTarget} Wörter
            </span>
          )}
          <button
            className="px-2 py-1 border rounded"
            onClick={() => setPaused(!paused)}
          >
            {paused ? "Resume" : "Pause"}
          </button>
          <button
            className="px-2 py-1 border rounded"
            onClick={() => {
              stopFlowMode()
            }}
          >
            Abort
          </button>
          {flowMode.timerType === "time" && (
            <button
              className="px-2 py-1 border rounded"
              onClick={() => updateFlowMode({ timerTarget: flowMode.timerTarget + 5 })}
            >
              +5 min
            </button>
          )}
        </div>
      )}
      <style jsx>{`
        @keyframes fadeout {
          from { opacity: 1; }
          to { opacity: 0; }
        }
      `}</style>
    </div>
  )
}
