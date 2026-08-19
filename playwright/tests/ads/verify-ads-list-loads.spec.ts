/**
 * @name     My Ads page loads and displays existing ads
 * @id       flow-1
 * @flow     playwright/flows/ads/flow.md
 * @coverage playwright/flows/ads/coverage.md
 *
 * Prerequisites: The test account (TEST_EMAIL) must have at least one existing ad.
 * loginPage.login() validates TEST_EMAIL / TEST_PASSWORD internally.
 */
import { test, expect } from "../../fixtures/fixtures";

/**
 * Flow 1 — My Ads page loads and displays existing ads.
 *
 * Smoke test: read-only page load that verifies the My Ads page renders all key
 * elements (create button, hide toggle, table, at least one ad row with a status badge).
 */
// Serial mode: shares TEST_EMAIL with verify-create-buy-ad; parallel logins invalidate each other's session.
test.describe.configure({ mode: "serial" });
test.describe("Ads — My Ads page loads", { tag: ["@ads", "@smoke", "@staging", "@desktop", "@mobile"] }, () => {
    test.beforeEach(async ({ loginPage }) => {
        await loginPage.login();
    });

    test("VERIFY My Ads page loads with all key elements visible and at least one ad is displayed", async ({
        adsPage,
    }) => {
        await adsPage.gotoAdsPage();
        await adsPage.verifyAdsPageLoaded();

        // Guard: wait for at least one ad card to appear (React Query loads asynchronously
        // after the page shell mounts) and fail fast with an actionable message if none exist.
        //
        // Use state:'attached' rather than toBeVisible() for the table/rows: the My Ads table
        // renders each row as a <tr> with display:grid (mobile responsive layout) inside a
        // flex-1 min-h-0 scroll container. On mobile viewports Playwright reports both the
        // container and the rows as "hidden" (zero bounding box) even when correctly rendered
        // on screen — confirmed via a11y snapshot and screenshot. attached only checks DOM
        // presence, which is what we actually mean here.
        // See AdsPage.verifyAdOnMyAds for the same layout-quirk workaround (textContent).
        await expect(
            adsPage.adCards.first(),
            "Test account must have at least one ad — check test account state",
        ).toBeAttached();

        // "Create ad" button (rendered outside the scroll container — reliably visible)
        await expect(adsPage.createAdButton, "Create ad button should be visible on My Ads page").toBeVisible();

        // "Pause my ads" toggle and label (only rendered when at least one ad exists;
        // also outside the scroll container — reliably visible)
        await expect(adsPage.hideMyAdsSwitch, "Pause my ads toggle should be visible when ads exist").toBeVisible();
        await expect(adsPage.hideMyAdsLabel, "Pause my ads label should be visible").toBeVisible();

        // Ads table container — attached, not visible (see layout note above). The first ad
        // row is already asserted via adCards.first() above (same locator), so it's not repeated here.
        await expect(adsPage.adsTableContainer, "Ads table container should be present").toBeAttached();

        // Status badge on the first ad row — assert its testid is present via the table's
        // outerHTML rather than toBeVisible(): the badge lives inside the grid <tr> and
        // inherits the same visibility-reporting quirk, so we check DOM presence instead.
        const tableHtml = await adsPage.adsTableContainer.evaluate((el) => el.outerHTML ?? "");
        expect(tableHtml, "Status badge should be present on the first ad row").toContain("ads-badge-status-");
    });
});
