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
        await expect(adsPage.adCards.first(), "Test account must have at least one ad — check test account state").toBeVisible();

        // "Create ad" button
        await expect(adsPage.createAdButton, "Create ad button should be visible on My Ads page").toBeVisible();

        // "Pause my ads" toggle and label (only rendered when at least one ad exists)
        await expect(adsPage.hideMyAdsSwitch, "Pause my ads toggle should be visible when ads exist").toBeVisible();
        await expect(adsPage.hideMyAdsLabel, "Pause my ads label should be visible").toBeVisible();

        // Ads table container
        await expect(adsPage.adsTableContainer, "Ads table container should be visible").toBeVisible();

        // At least one ad row in the table
        await expect(adsPage.firstAdRow, "At least one ad row should be visible in the table").toBeVisible();

        // Status badge on the first ad row
        await expect(adsPage.firstAdStatusBadge, "Status badge should be visible on the first ad row").toBeVisible();
    });
});
