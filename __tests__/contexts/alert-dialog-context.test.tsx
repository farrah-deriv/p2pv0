"use client"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { AlertDialogProvider, useAlertDialog } from "@/contexts/alert-dialog-context"
import jest from "jest" // Import jest to fix the undeclared variable error

// Test component to use the context
function TestComponent() {
  const { showAlert, hideAlert, isOpen } = useAlertDialog()

  return (
    <div>
      <button
        onClick={() =>
          showAlert({
            title: "Test Title",
            description: "Test Description",
            confirmText: "Confirm",
            cancelText: "Cancel",
            onConfirm: jest.fn(),
            onCancel: jest.fn(),
          })
        }
      >
        Show Alert
      </button>
      <button onClick={hideAlert}>Hide Alert</button>
      <div data-testid="is-open">{isOpen.toString()}</div>
    </div>
  )
}

describe("AlertDialogProvider", () => {
  it("should render children without crashing", () => {
    render(
      <AlertDialogProvider>
        <div>Test Child</div>
      </AlertDialogProvider>,
    )

    expect(screen.getByText("Test Child")).toBeInTheDocument()
  })

  it("should provide alert dialog context to children", () => {
    render(
      <AlertDialogProvider>
        <TestComponent />
      </AlertDialogProvider>,
    )

    expect(screen.getByText("Show Alert")).toBeInTheDocument()
    expect(screen.getByTestId("is-open")).toHaveTextContent("false")
  })

  it("should show alert dialog when showAlert is called", async () => {
    render(
      <AlertDialogProvider>
        <TestComponent />
      </AlertDialogProvider>,
    )

    fireEvent.click(screen.getByText("Show Alert"))

    await waitFor(() => {
      expect(screen.getByText("Test Title")).toBeInTheDocument()
      expect(screen.getByText("Test Description")).toBeInTheDocument()
      expect(screen.getByText("Confirm")).toBeInTheDocument()
      expect(screen.getByText("Cancel")).toBeInTheDocument()
    })

    expect(screen.getByTestId("is-open")).toHaveTextContent("true")
  })

  it("should hide alert dialog when hideAlert is called", async () => {
    render(
      <AlertDialogProvider>
        <TestComponent />
      </AlertDialogProvider>,
    )

    // Show alert first
    fireEvent.click(screen.getByText("Show Alert"))
    await waitFor(() => {
      expect(screen.getByText("Test Title")).toBeInTheDocument()
    })

    // Hide alert
    fireEvent.click(screen.getByText("Hide Alert"))
    await waitFor(() => {
      expect(screen.queryByText("Test Title")).not.toBeInTheDocument()
    })

    expect(screen.getByTestId("is-open")).toHaveTextContent("false")
  })

  it("should call onConfirm when confirm button is clicked", async () => {
    const onConfirm = jest.fn()

    function TestConfirmComponent() {
      const { showAlert } = useAlertDialog()

      return (
        <button
          onClick={() =>
            showAlert({
              title: "Confirm Test",
              onConfirm,
            })
          }
        >
          Show Confirm Alert
        </button>
      )
    }

    render(
      <AlertDialogProvider>
        <TestConfirmComponent />
      </AlertDialogProvider>,
    )

    fireEvent.click(screen.getByText("Show Confirm Alert"))

    await waitFor(() => {
      expect(screen.getByText("Confirm Test")).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText("Continue"))

    await waitFor(() => {
      expect(onConfirm).toHaveBeenCalledTimes(1)
    })
  })

  it("should call onCancel when cancel button is clicked", async () => {
    const onCancel = jest.fn()

    function TestCancelComponent() {
      const { showAlert } = useAlertDialog()

      return (
        <button
          onClick={() =>
            showAlert({
              title: "Cancel Test",
              onCancel,
            })
          }
        >
          Show Cancel Alert
        </button>
      )
    }

    render(
      <AlertDialogProvider>
        <TestCancelComponent />
      </AlertDialogProvider>,
    )

    fireEvent.click(screen.getByText("Show Cancel Alert"))

    await waitFor(() => {
      expect(screen.getByText("Cancel Test")).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText("Cancel"))

    await waitFor(() => {
      expect(onCancel).toHaveBeenCalledTimes(1)
    })
  })

  it("should throw error when useAlertDialog is used outside provider", () => {
    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {})

    function ComponentOutsideProvider() {
      useAlertDialog()
      return <div>Test</div>
    }

    expect(() => {
      render(<ComponentOutsideProvider />)
    }).toThrow("useAlertDialog must be used within an AlertDialogProvider")

    consoleSpy.mockRestore()
  })

  it("should handle async onConfirm function", async () => {
    const asyncOnConfirm = jest.fn().mockResolvedValue(undefined)

    function TestAsyncComponent() {
      const { showAlert } = useAlertDialog()

      return (
        <button
          onClick={() =>
            showAlert({
              title: "Async Test",
              onConfirm: asyncOnConfirm,
            })
          }
        >
          Show Async Alert
        </button>
      )
    }

    render(
      <AlertDialogProvider>
        <TestAsyncComponent />
      </AlertDialogProvider>,
    )

    fireEvent.click(screen.getByText("Show Async Alert"))

    await waitFor(() => {
      expect(screen.getByText("Async Test")).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText("Continue"))

    await waitFor(() => {
      expect(asyncOnConfirm).toHaveBeenCalledTimes(1)
    })
  })
})
