import { render, screen } from "@testing-library/react"
import TypewriterPage from "@/app/page"
import { useTypewriterStore } from "@/store/typewriter-store"

describe("OfflineIndicator", () => {
  const originalOnLine = navigator.onLine

  beforeEach(() => {
    useTypewriterStore.getState().resetSession()
    Object.defineProperty(window.navigator, "onLine", {
      configurable: true,
      value: false,
    })
  })

  afterEach(() => {
    Object.defineProperty(window.navigator, "onLine", {
      configurable: true,
      value: originalOnLine,
    })
  })

  it("renders a single offline indicator in light mode", async () => {
    useTypewriterStore.setState({ darkMode: false })
    render(<TypewriterPage />)
    const indicators = await screen.findAllByText("Offline-Modus")
    expect(indicators).toHaveLength(1)
  })

  it("renders a single offline indicator in dark mode", async () => {
    useTypewriterStore.setState({ darkMode: true })
    render(<TypewriterPage />)
    const indicators = await screen.findAllByText("Offline-Modus")
    expect(indicators).toHaveLength(1)
  })
})
