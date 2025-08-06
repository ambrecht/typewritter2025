"use client"

import { useState } from "react"
import { useTypewriterStore } from "@/store/typewriter-store"

interface FlowSettingsModalProps {
  isOpen: boolean
  onClose: () => void
  darkMode: boolean
}

export default function FlowSettingsModal({ isOpen, onClose, darkMode }: FlowSettingsModalProps) {
  const { startFlowMode } = useTypewriterStore()
  const [timerType, setTimerType] = useState<"time" | "words">("time")
  const [value, setValue] = useState(15)

  if (!isOpen) return null

  const start = () => {
    startFlowMode(timerType, value)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className={`p-6 rounded-lg shadow-lg ${darkMode ? "bg-gray-800 text-gray-200" : "bg-white"}`}
        style={{ width: "90%", maxWidth: "420px" }}>
        <h2 className="text-lg font-serif mb-4">Flow Mode</h2>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <label className="font-serif">Timer</label>
            <select
              value={timerType}
              onChange={(e) => setTimerType(e.target.value as "time" | "words")}
              className="border rounded px-2 py-1 flex-1 bg-transparent"
            >
              <option value="time">Zeit (Min)</option>
              <option value="words">Wörter</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="font-serif flex-1">Ziel</label>
            <input
              type="number"
              min={1}
              value={value}
              onChange={(e) => setValue(Number(e.target.value))}
              className="border rounded px-2 py-1 w-24 bg-transparent"
            />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1 border rounded font-serif"
          >
            Abbrechen
          </button>
          <button
            onClick={start}
            className="px-3 py-1 border rounded font-serif bg-blue-600 text-white"
          >
            Start
          </button>
        </div>
      </div>
    </div>
  )
}
