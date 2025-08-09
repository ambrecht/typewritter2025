import { render } from "@testing-library/react"
import { LineStack } from "@/components/writing-area/LineStack"

describe("LineStack", () => {
  const sampleLines = [{ line: { text: "Zeile 1" }, index: 0, key: "0" }]

  it("anchors lines at the top in write mode", () => {
    const { container } = render(
      <LineStack visibleLines={sampleLines} mode="write" />,
    )
    const stack = container.querySelector(".line-stack") as HTMLElement
    expect(stack.style.justifyContent).toBe("flex-start")
  })

  it("anchors lines at the top in navigation mode", () => {
    const { container } = render(
      <LineStack visibleLines={sampleLines} mode="nav" />,
    )
    const stack = container.querySelector(".line-stack") as HTMLElement
    expect(stack.style.justifyContent).toBe("flex-start")
  })
})
