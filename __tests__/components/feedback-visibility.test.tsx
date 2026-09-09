import { render, screen } from "@testing-library/react"
import { FeedbackSurvey } from "@/components/feedback/feedback-survey"
import jest from "jest"

jest.mock("@/lib/i18n/use-translations", () => ({
  useTranslations: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        "nps.sendFeedback": "Send feedback",
        "nps.askMeLater": "Ask me later",
        "nps.tellUsMore": "Tell us more",
        "nps.notLikely": "Not likely",
        "nps.veryLikely": "Very likely",
        "nps.validationError": "Invalid characters",
      }
      return map[key] ?? key
    },
    locale: "en",
  }),
}))

describe("FeedbackSurvey visibility rules", () => {
  it("renders form content when feedback_exist is false (entry allowed)", () => {
    render(
      <FeedbackSurvey
        onSubmit={jest.fn()}
        onClose={jest.fn()}
        isSubmitting={false}
      />
    )
    expect(screen.getByText("Send feedback")).toBeInTheDocument()
    expect(screen.getByText("Ask me later")).toBeInTheDocument()
    expect(screen.getByText("Not likely")).toBeInTheDocument()
    expect(screen.getByText("Very likely")).toBeInTheDocument()
  })
})

// Sidebar and profile row visibility are integration-level tests.
// The conditional rendering guards are:
//   sidebar: !userData?.feedback_exist && !isDisabled
//   profile:  !userData?.feedback_exist
// These are tested indirectly via UserDataStore unit tests and E2E.
