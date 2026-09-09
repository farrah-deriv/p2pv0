"use client"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { AlertDialogProvider } from "@/contexts/alert-dialog-context"
import { useAlertDialog } from "@/hooks/use-alert-dialog"

jest.mock("@/lib/i18n/use-translations", () => ({
  useTranslations: () => ({
    t: (key: string) =>
      ({
        "common.confirm": "Confirm",
        "common.cancel": "Cancel",
        "common.delete": "Delete",
        "common.deleteItemTitle": "Delete item",
        "common.deleteItemDescription":
          "Are you sure you want to delete this item? This action cannot be undone.",
        "common.warning": "Warning",
        "common.continue": "Continue",
      })[key] ?? key,
    locale: "en",
  }),
}))

function TestHookComponent() {
  const { showConfirmDialog, showDeleteDialog, showWarningDialog, hideAlert } = useAlertDialog()

  return (
    <div>
      <button
        onClick={() =>
          showConfirmDialog({
            title: "Confirm Test",
            description: "Confirm description",
          })
        }
      >
        Show Confirm
      </button>
      <button
        onClick={() =>
          showDeleteDialog({
            title: "Custom Delete Title",
            description: "Custom delete description",
          })
        }
      >
        Show Delete
      </button>
      <button
        onClick={() =>
          showWarningDialog({
            description: "Warning description",
          })
        }
      >
        Show Warning
      </button>
      <button onClick={hideAlert}>Hide Alert</button>
    </div>
  )
}

describe("useAlertDialog hook", () => {
  it("should show confirm dialog with correct defaults", async () => {
    render(
      <AlertDialogProvider>
        <TestHookComponent />
      </AlertDialogProvider>,
    )

    fireEvent.click(screen.getByText("Show Confirm"))

    await waitFor(() => {
      expect(screen.getByText("Confirm Test")).toBeInTheDocument()
      expect(screen.getByText("Confirm description")).toBeInTheDocument()
      expect(screen.getByText("Confirm")).toBeInTheDocument()
      expect(screen.getByText("Cancel")).toBeInTheDocument()
    })
  })

  it("should show delete dialog with destructive styling", async () => {
    render(
      <AlertDialogProvider>
        <TestHookComponent />
      </AlertDialogProvider>,
    )

    fireEvent.click(screen.getByText("Show Delete"))

    await waitFor(() => {
      expect(screen.getByText("Custom Delete Title")).toBeInTheDocument()
      expect(screen.getByText("Custom delete description")).toBeInTheDocument()
      expect(screen.getByText("Delete")).toBeInTheDocument()
      expect(screen.getByText("Cancel")).toBeInTheDocument()
    })

    // Check if the delete button has destructive styling
    const deleteButton = screen.getByText("Delete")
    expect(deleteButton).toHaveClass("bg-destructive")
  })

  it("should show warning dialog with correct defaults", async () => {
    render(
      <AlertDialogProvider>
        <TestHookComponent />
      </AlertDialogProvider>,
    )

    fireEvent.click(screen.getByText("Show Warning"))

    await waitFor(() => {
      expect(screen.getByText("Warning")).toBeInTheDocument()
      expect(screen.getByText("Warning description")).toBeInTheDocument()
      expect(screen.getByText("Continue")).toBeInTheDocument()
      expect(screen.getByText("Cancel")).toBeInTheDocument()
    })
  })

  it("should hide alert when hideAlert is called", async () => {
    render(
      <AlertDialogProvider>
        <TestHookComponent />
      </AlertDialogProvider>,
    )

    // Show alert first
    fireEvent.click(screen.getByText("Show Confirm"))
    await waitFor(() => {
      expect(screen.getByText("Confirm Test")).toBeInTheDocument()
    })

    // Hide alert
    fireEvent.click(screen.getByText("Hide Alert"))
    await waitFor(() => {
      expect(screen.queryByText("Confirm Test")).not.toBeInTheDocument()
    })
  })
})
