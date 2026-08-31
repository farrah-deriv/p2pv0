import { render, screen, fireEvent } from "@testing-library/react"
import FollowUserList from "@/app/profile/components/follow-user-list"
import jest from "jest"

// EmptyState is stubbed so the assertion is about WHICH state the list picks,
// not about how EmptyState paints itself.
jest.mock("@/components/empty-state", () => ({
  __esModule: true,
  default: ({ title, description, actionLabel, onAction }: any) => (
    <div data-testid="empty-state">
      <span data-testid="empty-state-title">{title}</span>
      <span data-testid="empty-state-description">{description}</span>
      {actionLabel && onAction && (
        <button data-testid="empty-state-action" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  ),
}))

jest.mock("@/lib/i18n/use-translations", () => ({
  useTranslations: () => ({
    t: (key: string) => key,
    locale: "en",
  }),
}))

const baseProps = {
  users: [],
  isLoading: false,
  searchQuery: "",
  onSearchChange: jest.fn(),
  onClearSearch: jest.fn(),
  onUserClick: jest.fn(),
  onFollowToggle: jest.fn(),
  followingUserIds: [],
  emptyTitle: "profile.notFollowingAnyone",
  emptyDescription: "profile.startFollowing",
  searchEmptyTitle: "profile.noMatchingName",
  searchEmptyDescription: "profile.noResultFor",
}

describe("FollowUserList request-failure state", () => {
  beforeEach(() => jest.clearAllMocks())

  it("shows the load-failure state instead of the zero-results state when the query errored", () => {
    render(
      <FollowUserList
        {...baseProps}
        isError
        errorTitle="errors.loadFollowingFailedTitle"
        onRetry={jest.fn()}
      />,
    )

    expect(screen.getByTestId("empty-state-title")).toHaveTextContent("errors.loadFollowingFailedTitle")
    expect(screen.getByTestId("empty-state-description")).toHaveTextContent("errors.loadFailedDescription")
    // The regression: an empty `users` array used to be read as "nothing to show".
    expect(screen.getByTestId("empty-state-title")).not.toHaveTextContent("profile.notFollowingAnyone")
  })

  it("retries in place rather than navigating or reloading", () => {
    const onRetry = jest.fn()
    render(
      <FollowUserList
        {...baseProps}
        isError
        errorTitle="errors.loadFollowersFailedTitle"
        onRetry={onRetry}
      />,
    )

    fireEvent.click(screen.getByTestId("empty-state-action"))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it("keeps the load-failure state while searching instead of reporting a search miss", () => {
    render(
      <FollowUserList
        {...baseProps}
        searchQuery="alice"
        activeSearchQuery="alice"
        isError
        errorTitle="errors.loadFollowingFailedTitle"
        onRetry={jest.fn()}
      />,
    )

    // Filtering an array that is empty because the fetch failed used to render "No matching name".
    expect(screen.getByTestId("empty-state-title")).toHaveTextContent("errors.loadFollowingFailedTitle")
    expect(screen.getByTestId("empty-state-title")).not.toHaveTextContent("profile.noMatchingName")
    expect(screen.getByTestId("empty-state-action")).toBeTruthy()
  })

  it("still shows the zero-results state when the query succeeded with no rows", () => {
    render(<FollowUserList {...baseProps} />)

    expect(screen.getByTestId("empty-state-title")).toHaveTextContent("profile.notFollowingAnyone")
    expect(screen.queryByTestId("empty-state-action")).toBeNull()
  })
})

describe("FollowUserList search visibility", () => {
  beforeEach(() => jest.clearAllMocks())

  // Mobile `following_page.dart` renders the search field above the list unconditionally. Typing
  // a nickname is a new server query, so it is a way out of a failed fetch — but only if the
  // field is still on screen to type into.
  it("keeps the search field mounted when the unfiltered fetch failed", () => {
    render(
      <FollowUserList
        {...baseProps}
        isError
        errorTitle="errors.loadFollowingFailedTitle"
        onRetry={jest.fn()}
      />,
    )

    // The regression: the toolbar was gated on `users.length > 0 || searchQuery`, so a first-load
    // failure with an empty search unmounted it and left Retry as the only exit.
    expect(screen.getByTestId("follow-user-list-search")).toBeTruthy()
    expect(screen.getByPlaceholderText("common.search")).toBeTruthy()
  })

  it("lets the user type a nickname while the error state is showing", () => {
    const onSearchChange = jest.fn()
    render(
      <FollowUserList
        {...baseProps}
        isError
        errorTitle="errors.loadFollowingFailedTitle"
        onRetry={jest.fn()}
        onSearchChange={onSearchChange}
      />,
    )

    fireEvent.change(screen.getByPlaceholderText("common.search"), { target: { value: "alice" } })
    expect(onSearchChange).toHaveBeenCalledTimes(1)
  })

  it("keeps the search field mounted while loading and on an empty list", () => {
    const { rerender } = render(<FollowUserList {...baseProps} isLoading />)
    expect(screen.getByTestId("follow-user-list-search")).toBeTruthy()

    rerender(<FollowUserList {...baseProps} />)
    expect(screen.getByTestId("follow-user-list-search")).toBeTruthy()
  })

  it("keeps the search field mounted when a search matched nothing", () => {
    render(<FollowUserList {...baseProps} searchQuery="zzz" activeSearchQuery="zzz" />)

    expect(screen.getByTestId("follow-user-list-search")).toBeTruthy()
    expect(screen.getByTestId("empty-state-title")).toHaveTextContent("profile.noMatchingName")
  })
})
