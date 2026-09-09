import type { CurrentHistory, NavigationEntry } from "@/lib/navigation/back-navigation"
import { canReturnWithinApp } from "@/lib/navigation/back-navigation"

const entry = (overrides: Partial<NavigationEntry> = {}): NavigationEntry => ({
  historyLength: 1,
  referrer: "",
  ...overrides,
})

const current = (overrides: Partial<CurrentHistory> = {}): CurrentHistory => ({
  historyLength: 1,
  sameOriginEntryIndex: null,
  ...overrides,
})

describe("canReturnWithinApp", () => {
  describe("deep-link entry (the reported defect)", () => {
    it("refuses to go back when the tab was opened directly on the page", () => {
      expect(canReturnWithinApp(entry(), current())).toBe(false)
    })

    it("refuses to go back when the browser reports a stub entry behind a pasted deep link", () => {
      // The regression: `window.history.length > 1` is true here even though the only
      // entry behind this document is the browser's own blank stub, so the old guard
      // called router.back() and walked the user out of the SPA to about:blank.
      expect(
        canReturnWithinApp(entry({ historyLength: 2, referrer: "" }), current({ historyLength: 2 })),
      ).toBe(false)
    })

    it("refuses to go back when a link opened the page in a new tab", () => {
      // A new tab carries the opener's referrer but has no entry to return to.
      expect(
        canReturnWithinApp(
          entry({ historyLength: 1, referrer: "https://home.deriv.com/" }),
          current({ historyLength: 1 }),
        ),
      ).toBe(false)
    })

    it("refuses to go back after an in-app push has been unwound back to the entry point", () => {
      // history.length never shrinks, so length alone still reads as "we have history"
      // once the user has returned to the page they deep-linked into. The same-origin
      // entry index is back at 0, which is the truthful answer.
      expect(
        canReturnWithinApp(
          entry({ historyLength: 1, referrer: "" }),
          current({ historyLength: 2, sameOriginEntryIndex: 0 }),
        ),
      ).toBe(false)
    })
  })

  describe("entries that do have somewhere to go back to", () => {
    it("goes back after an in-app navigation pushed an entry", () => {
      expect(
        canReturnWithinApp(entry({ historyLength: 1 }), current({ historyLength: 2 })),
      ).toBe(true)
    })

    it("goes back after an in-app navigation when the Navigation API is available", () => {
      expect(
        canReturnWithinApp(
          entry({ historyLength: 1 }),
          current({ historyLength: 2, sameOriginEntryIndex: 1 }),
        ),
      ).toBe(true)
    })

    it("goes back to the previous document when the page was reached from Deriv home", () => {
      expect(
        canReturnWithinApp(
          entry({ historyLength: 2, referrer: "https://home.deriv.com/" }),
          current({ historyLength: 2, sameOriginEntryIndex: 0 }),
        ),
      ).toBe(true)
    })
  })
})
