import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { HeaderSegmentedControl } from "@/components/header-segmented-control"

describe("HeaderSegmentedControl", () => {
  const segments = [
    { value: "active", label: "Active", testId: "tab-active" },
    { value: "past", label: "Past", testId: "tab-past" },
  ]

  it("renders segments and calls onValueChange", async () => {
    const user = userEvent.setup()
    const onValueChange = jest.fn()

    render(
      <HeaderSegmentedControl
        value="active"
        onValueChange={onValueChange}
        segments={segments}
        width={168}
      />,
    )

    expect(screen.getByTestId("tab-active")).toHaveTextContent("Active")
    expect(screen.getByTestId("tab-past")).toHaveTextContent("Past")

    await user.click(screen.getByTestId("tab-past"))
    expect(onValueChange).toHaveBeenCalledWith("past")
  })

  it("applies fixed width class", () => {
    const { container } = render(
      <HeaderSegmentedControl
        value="active"
        onValueChange={() => {}}
        segments={segments}
        width={184}
      />,
    )

    expect(container.querySelector('[role="tablist"]')).toHaveClass("w-[184px]")
  })

  it("renders sliding selection indicator", () => {
    const { container } = render(
      <HeaderSegmentedControl
        value="past"
        onValueChange={() => {}}
        segments={segments}
        width={168}
      />,
    )

    const indicator = container.querySelector('[role="tablist"] > span[aria-hidden="true"]')
    expect(indicator).toBeInTheDocument()
    expect(indicator).toHaveClass("transition-[inset-inline-start]")
  })
})
