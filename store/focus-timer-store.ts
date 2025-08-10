import { create } from "zustand"

interface FocusTimerState {
  running: boolean
  endTime: number
  start: (minutes: number) => void
  stop: () => void
}

export const useFocusTimerStore = create<FocusTimerState>((set) => ({
  running: false,
  endTime: 0,
  start: (minutes: number) =>
    set({ running: true, endTime: Date.now() + minutes * 60 * 1000 }),
  stop: () => set({ running: false, endTime: 0 }),
}))
