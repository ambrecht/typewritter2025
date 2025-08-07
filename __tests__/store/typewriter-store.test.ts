import { describe, it, expect, beforeEach } from "@jest/globals"
import { useTypewriterStore } from "@/store/typewriter-store"
import { act, renderHook } from "@testing-library/react"

describe("TypewriterStore", () => {
  beforeEach(() => {
    // Reset store before each test
    useTypewriterStore.getState().resetSession()
  })

  it("should initialize with default state", () => {
    const { result } = renderHook(() => useTypewriterStore())

    expect(result.current.lines).toEqual([])
    expect(result.current.activeLine).toBe("")
    expect(result.current.mode).toBe("typing")
  })

  it("should set active line", () => {
    const { result } = renderHook(() => useTypewriterStore())

    act(() => {
      result.current.setActiveLine("Test line")
    })

    expect(result.current.activeLine).toBe("Test line")
  })

  it("should add line to stack", () => {
    const { result } = renderHook(() => useTypewriterStore())

    act(() => {
      result.current.setActiveLine("Test line")
      result.current.addLineToStack()
    })

    expect(result.current.lines).toHaveLength(1)
    expect(result.current.lines[0].text).toBe("Test line")
    expect(result.current.activeLine).toBe("")
  })

  it("should adjust offset", () => {
    const { result } = renderHook(() => useTypewriterStore())

    act(() => {
      result.current.setActiveLine("Line 1")
      result.current.addLineToStack()
      result.current.setActiveLine("Line 2")
      result.current.addLineToStack()
      result.current.setMaxVisibleLines(1)
    })

    act(() => {
      result.current.adjustOffset(1)
    })

    expect(result.current.mode).toBe("navigating")
    expect(result.current.offset).toBe(1)

    act(() => {
      result.current.adjustOffset(-1)
    })

    expect(result.current.offset).toBe(0)
  })

  it("should update line break config", () => {
    const { result } = renderHook(() => useTypewriterStore())

    act(() => {
      result.current.updateLineBreakConfig({ maxCharsPerLine: 80 })
    })

    expect(result.current.lineBreakConfig.maxCharsPerLine).toBe(80)
    expect(result.current.maxCharsPerLine).toBe(80)
  })

  it("should toggle dark mode", () => {
    const { result } = renderHook(() => useTypewriterStore())

    const initialDarkMode = result.current.darkMode

    act(() => {
      result.current.toggleDarkMode()
    })

    expect(result.current.darkMode).toBe(!initialDarkMode)
  })

  it("should reset session", () => {
    const { result } = renderHook(() => useTypewriterStore())

    // Add some content
    act(() => {
      result.current.setActiveLine("Test line")
      result.current.addLineToStack()
      result.current.setMode("navigating")
      result.current.adjustOffset(1)
    })

    // Reset session
    act(() => {
      result.current.resetSession()
    })

    expect(result.current.lines).toEqual([])
    expect(result.current.activeLine).toBe("")
    expect(result.current.mode).toBe("typing")
    expect(result.current.offset).toBe(0)
  })
})
