/**
 * @name     Create a Buy ad (3-step wizard, fixed rate)
 * @id       flow-3
 * @flow     playwright/flows/ads/flow.md
 * @coverage playwright/flows/ads/coverage.md
 *
 * Prerequisites:
 *  - TEST_EMAIL / TEST_PASSWORD set in playwright/.env.staging
 *  - Account is KYC-verified with P2P enabled
 *  - Account has at least one compatible payment method
 *  - Fixed rate mode used to avoid WebSocket-dependent flakiness (catalog decision D-RATE)
 *
 * loginPage.login() validates TEST_EMAIL / TEST_PASSWORD internally.
 */
import { test, expect } from "../../fixtures/fixtures";

/**
 * Flow 3 — Create a Buy ad via the 3-step wizard (fixed rate).
 *
 * Covers the end-to-end create flow: My Ads → wizard step 0 → step 1 → step 2 → success screen.
 */
// Serial mode: shares TEST_EMAIL with verify-ads-list-loads; parallel logins invalidate each other's session.
test.describe.configure({ mode: "serial" });
test.describe("Ads — Create Buy ad", { tag: ["@ads", "@staging", "@desktop", "@mobile"] }, () => {
    test.beforeEach(async ({ loginPage, adsPage }, testInfo) => {
        await loginPage.login();
        // Delete only the rate this project will create — avoids cross-project race conditions
        // when chromium and chromium-mobile share the same account and run in parallel.
        const rate = testInfo.project.name.includes("mobile") ? "1.51" : "1.50";
        await adsPage.deleteAdsByRate(rate);
    });

    test("VERIFY a Buy ad can be created through the 3-step wizard and the success screen is shown", async ({
        adsPage,
        adsCreatePage,
        marketPage,
    }, testInfo) => {
        // Use project-specific ad data to prevent duplicate-rate and overlapping-range
        // conflicts when chromium and chromium-mobile run in parallel against the same
        // test account. Both ranges are within the account's known P2P balance (≤500 USD),
        // and they don't overlap: desktop uses 10–250, mobile uses 251–499.
        const isMobile = testInfo.project.name.includes("mobile");
        const rate = isMobile ? "1.51" : "1.50";
        const minOrder = isMobile ? "251" : "10";
        const maxOrder = isMobile ? "499" : "250";

        // Navigate to My Ads and open the Create ad wizard
        await adsPage.gotoAdsPage();
        await adsPage.verifyAdsPageLoaded();
        await adsPage.clickCreateAd();

        // Step 0 — Set ad and rate type
        // Buy type is pre-selected by default; no need to change trade type
        await adsCreatePage.verifyStep0Visible();
        await adsCreatePage.fillAdStep0(rate, "1000", minOrder, maxOrder);
        await adsCreatePage.proceedToStep1();

        // Step 1 — Set payment details
        await adsCreatePage.verifyStep1Visible();
        await adsCreatePage.selectFirstPaymentMethod();
        await adsCreatePage.proceedToStep2();

        // Step 2 — Set ad conditions (order time limit pre-selected; no change needed)
        await adsCreatePage.verifyStep2Visible();
        await adsCreatePage.submitCreateAd();

        // Success screen confirms the ad was created
        await adsCreatePage.verifySuccessScreen();

        // Navigate to the Market and verify the new ad appears on the Sell tab.
        // The Sell tab shows Buy-type ads — advertisers who want to BUY, so other
        // users can SELL to them. Our created Buy ad should appear there.
        await marketPage.gotoMarketPageDefault();
        await marketPage.verifyMarketPageLoaded();
        // The P2P API returns amounts formatted with two decimal places (e.g. "10.00").
        await marketPage.verifyAdOnSellTab(rate, `${minOrder}.00`, `${maxOrder}.00`, "USD");
    });
});
