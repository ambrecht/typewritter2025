import { render, fireEvent, act } from "@testing-library/react"
import TypewriterPage from "@/app/page"
import { useTypewriterStore } from "@/store/typewriter-store"

describe("Android key event sequence", () => {
  beforeAll(() => {
    HTMLCanvasElement.prototype.getContext = () => ({
      measureText: () => ({ width: 10 }),
    }) as any
  })

  beforeEach(() => {
    useTypewriterStore.getState().resetSession()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it("deduplicates rapid same keydown events", () => {
    render(<TypewriterPage />)

    act(() => {
      fireEvent.keyDown(document.body, { key: "a" })
      jest.advanceTimersByTime(20)
      fireEvent.keyDown(document.body, { key: "a" })
      fireEvent.keyUp(document.body, { key: "a" })
    })

    expect(useTypewriterStore.getState().activeLine).toBe("a")
  })

  it("processes keydown after cooldown", () => {
    render(<TypewriterPage />)

    act(() => {
      fireEvent.keyDown(document.body, { key: "a" })
      fireEvent.keyUp(document.body, { key: "a" })
      jest.advanceTimersByTime(60)
      fireEvent.keyDown(document.body, { key: "a" })
      fireEvent.keyUp(document.body, { key: "a" })
    })

    expect(useTypewriterStore.getState().activeLine).toBe("aa")
  })
})
