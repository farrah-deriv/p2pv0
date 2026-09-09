import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { FeedbackSurvey } from "@/components/feedback/feedback-survey"
import jest from "jest"

jest.mock("@/lib/i18n/use-translations", () => ({
  useTranslations: () => ({
    t: (key: string, params?: Record<string, string | number>) => {
      const map: Record<string, string> = {
        "nps.sendFeedback": "Send feedback",
        "nps.askMeLater": "Ask me later",
        "nps.tellUsMore": "Tell us more",
        "nps.notLikely": "Not likely",
        "nps.veryLikely": "Very likely",
        "nps.validationError":
          "Only letters, numbers, spaces, and the following special characters are allowed: @ - . ! / % & , _ ( ) + : ;",
      }
      let value = map[key] ?? key
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          value = value.replace(`{${k}}`, String(v))
        })
      }
      return value
    },
    locale: "en",
  }),
}))

describe("FeedbackSurvey", () => {
  const defaultProps = {
    onSubmit: jest.fn(),
    onClose: jest.fn(),
    isSubmitting: false,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("renders score buttons 0 through 10", () => {
    render(<FeedbackSurvey {...defaultProps} />)
    for (let i = 0; i <= 10; i++) {
      expect(screen.getByRole("button", { name: `${i} out of 10` })).toBeInTheDocument()
    }
  })

  it("renders Not likely and Very likely labels", () => {
    render(<FeedbackSurvey {...defaultProps} />)
    expect(screen.getByText("Not likely")).toBeInTheDocument()
    expect(screen.getByText("Very likely")).toBeInTheDocument()
  })

  it("submit button is disabled when no score and no review text", () => {
    render(<FeedbackSurvey {...defaultProps} />)
    expect(screen.getByRole("button", { name: "Send feedback" })).toBeDisabled()
  })

  it("submit button is disabled when score selected but review text is empty", () => {
    render(<FeedbackSurvey {...defaultProps} />)
    fireEvent.click(screen.getByRole("button", { name: "7 out of 10" }))
    expect(screen.getByRole("button", { name: "Send feedback" })).toBeDisabled()
  })

  it("submit button is disabled when review text entered but no score selected", () => {
    render(<FeedbackSurvey {...defaultProps} />)
    const textarea = screen.getByPlaceholderText("Tell us more")
    fireEvent.change(textarea, { target: { value: "Great experience" } })
    expect(screen.getByRole("button", { name: "Send feedback" })).toBeDisabled()
  })

  it("submit button is enabled when both score and valid review text are present", () => {
    render(<FeedbackSurvey {...defaultProps} />)
    fireEvent.click(screen.getByRole("button", { name: "8 out of 10" }))
    const textarea = screen.getByPlaceholderText("Tell us more")
    fireEvent.change(textarea, { target: { value: "Great app experience." } })
    expect(screen.getByRole("button", { name: "Send feedback" })).not.toBeDisabled()
  })

  it("score 0 is a valid selection and enables submit with review text", () => {
    render(<FeedbackSurvey {...defaultProps} />)
    fireEvent.click(screen.getByRole("button", { name: "0 out of 10" }))
    const textarea = screen.getByPlaceholderText("Tell us more")
    fireEvent.change(textarea, { target: { value: "Not good at all" } })
    expect(screen.getByRole("button", { name: "Send feedback" })).not.toBeDisabled()
  })

  it("submit button is disabled when review text is only whitespace", () => {
    render(<FeedbackSurvey {...defaultProps} />)
    fireEvent.click(screen.getByRole("button", { name: "5 out of 10" }))
    const textarea = screen.getByPlaceholderText("Tell us more")
    fireEvent.change(textarea, { target: { value: "   " } })
    expect(screen.getByRole("button", { name: "Send feedback" })).toBeDisabled()
  })

  it("shows character counter when text is valid", () => {
    render(<FeedbackSurvey {...defaultProps} />)
    const textarea = screen.getByPlaceholderText("Tell us more")
    fireEvent.change(textarea, { target: { value: "Hello" } })
    expect(screen.getByText("5/500")).toBeInTheDocument()
  })

  it("does not allow input beyond MAX_REVIEW_LENGTH (500 chars)", () => {
    render(<FeedbackSurvey {...defaultProps} />)
    const textarea = screen.getByPlaceholderText("Tell us more")
    const longText = "a".repeat(501)
    fireEvent.change(textarea, { target: { value: longText } })
    expect((textarea as HTMLTextAreaElement).value).toHaveLength(0)
  })

  it("shows validation error for invalid characters", () => {
    render(<FeedbackSurvey {...defaultProps} />)
    const textarea = screen.getByPlaceholderText("Tell us more")
    fireEvent.change(textarea, { target: { value: "bad chars <>" } })
    expect(
      screen.getByText(
        "Only letters, numbers, spaces, and the following special characters are allowed: @ - . ! / % & , _ ( ) + : ;"
      )
    ).toBeInTheDocument()
  })

  it("disables submit when review contains invalid characters", () => {
    render(<FeedbackSurvey {...defaultProps} />)
    fireEvent.click(screen.getByRole("button", { name: "3 out of 10" }))
    const textarea = screen.getByPlaceholderText("Tell us more")
    fireEvent.change(textarea, { target: { value: "bad chars <>" } })
    expect(screen.getByRole("button", { name: "Send feedback" })).toBeDisabled()
  })

  it("selecting a different score replaces the previous selection", () => {
    render(<FeedbackSurvey {...defaultProps} />)
    fireEvent.click(screen.getByRole("button", { name: "3 out of 10" }))
    fireEvent.click(screen.getByRole("button", { name: "9 out of 10" }))
    const textarea = screen.getByPlaceholderText("Tell us more")
    fireEvent.change(textarea, { target: { value: "Changed my mind" } })
    fireEvent.click(screen.getByRole("button", { name: "Send feedback" }))
    expect(defaultProps.onSubmit).toHaveBeenCalledWith(9, "Changed my mind")
    expect(defaultProps.onSubmit).not.toHaveBeenCalledWith(3, expect.anything())
  })

  it("calls onSubmit with score and trimmed review text when submitted", async () => {
    render(<FeedbackSurvey {...defaultProps} />)
    fireEvent.click(screen.getByRole("button", { name: "9 out of 10" }))
    const textarea = screen.getByPlaceholderText("Tell us more")
    fireEvent.change(textarea, { target: { value: "  Great app!  " } })
    fireEvent.click(screen.getByRole("button", { name: "Send feedback" }))
    await waitFor(() => {
      expect(defaultProps.onSubmit).toHaveBeenCalledWith(9, "Great app!")
    })
  })

  it("calls onClose when Ask me later is clicked", () => {
    render(<FeedbackSurvey {...defaultProps} />)
    fireEvent.click(screen.getByRole("button", { name: "Ask me later" }))
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
  })

  it("disables all controls while submitting", () => {
    render(<FeedbackSurvey {...defaultProps} isSubmitting={true} />)
    expect(screen.getByRole("button", { name: "Send feedback" })).toBeDisabled()
    expect(screen.getByRole("button", { name: "Ask me later" })).toBeDisabled()
    for (let i = 0; i <= 10; i++) {
      expect(screen.getByRole("button", { name: `${i} out of 10` })).toBeDisabled()
    }
  })

  it("allowed characters pass validation", () => {
    render(<FeedbackSurvey {...defaultProps} />)
    const textarea = screen.getByPlaceholderText("Tell us more")
    fireEvent.change(textarea, { target: { value: "Valid text @-./!%&,_()+:;" } })
    expect(
      screen.queryByText(
        "Only letters, numbers, spaces, and the following special characters are allowed: @ - . ! / % & , _ ( ) + : ;"
      )
    ).not.toBeInTheDocument()
  })
})
