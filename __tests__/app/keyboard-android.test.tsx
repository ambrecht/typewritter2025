import { act } from "@testing-library/react"
import { fireEvent, render } from "@testing-library/react"
import TypewriterPage from "@/app/page"
import { useTypewriterStore } from "@/store/typewriter-store"

/**
 * Diese Tests stellen sicher, dass die globale Keydown‑Logik unter Android
 * weder `event.repeat` noch IME‑Kompositions‑Ereignisse verarbeitet.
 * Durch das Setzen des UserAgents auf Android simulieren wir die Umgebung.
 */
describe("Android‑Tastatureingabe", () => {
  const originalUserAgent = window.navigator.userAgent

  beforeEach(() => {
    // UserAgent auf Android setzen, damit ggf. Android‑spezifische Logik aktiv wird
    Object.defineProperty(window.navigator, "userAgent", {
      value: "Mozilla/5.0 (Android 10; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36",
      configurable: true,
    })
    // Zustand zuruecksetzen
    useTypewriterStore.getState().resetSession()
  })

  afterEach(() => {
    // UserAgent wiederherstellen
    Object.defineProperty(window.navigator, "userAgent", { value: originalUserAgent, configurable: true })
  })

  it("verarbeitet einfache Tastendruecke ohne Duplizierung", () => {
    render(<TypewriterPage />)
    // Simuliere einen nicht wiederholten Tastendruck auf "a"
    act(() => {
      fireEvent.keyDown(document, { key: "a", code: "KeyA", repeat: false, isComposing: false })
    })
    expect(useTypewriterStore.getState().activeLine).toBe("a")
  })

  it("ignoriert wiederholte keydown‑Events", () => {
    render(<TypewriterPage />)
    // Simuliere einen wiederholten Tastendruck auf "b"
    act(() => {
      fireEvent.keyDown(document, { key: "b", code: "KeyB", repeat: true, isComposing: false })
    })
    // Es sollte nichts eingetragen werden
    expect(useTypewriterStore.getState().activeLine).toBe("")
  })

  it("ignoriert Kompositions‑Events der Eingabemethode", () => {
    render(<TypewriterPage />)
    // Simuliere einen Tastendruck in einer IME‑Komposition
    act(() => {
      fireEvent.keyDown(document, { key: "c", code: "KeyC", repeat: false, isComposing: true })
    })
    expect(useTypewriterStore.getState().activeLine).toBe("")
  })
})