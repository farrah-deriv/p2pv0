/**
 * @name     Create a Sell ad (3-step wizard, fixed rate)
 * @id       flow-4
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
import { test } from "../../fixtures/fixtures";

/**
 * Flow 4 — Create a Sell ad via the 3-step wizard (fixed rate).
 *
 * Covers the end-to-end create flow: My Ads → wizard step 0 (select Sell type) →
 * step 1 → step 2 → success screen → verify ad on Market Buy tab.
 *
 * Uses TEST_EMAIL_SELLER so the sell-side account is isolated from the buy-side
 * account used in verify-create-buy-ad.spec.ts — avoids duplicate-ad conflicts
 * when both specs run in parallel.
 */
test.describe("Ads — Create Sell ad", { tag: ["@ads", "@staging", "@desktop", "@mobile"] }, () => {
    let sellerEmail: string = undefined!;

    test.beforeAll(() => {
        const email = process.env.TEST_EMAIL_SELLER;
        if (!email) throw new Error("TEST_EMAIL_SELLER not set in playwright/.env.staging");
        sellerEmail = email;
    });

    test.beforeEach(async ({ loginPage, adsPage }, testInfo) => {
        await loginPage.login(sellerEmail);
        // Delete only the rate this project will create — avoids cross-project race conditions
        // when chromium and chromium-mobile share the same account and run in parallel.
        const rate = testInfo.project.name.includes("mobile") ? "1.51" : "1.50";
        const apiBase = await adsPage.deleteAdsByRate(rate);
        // Sell ads require the account to have at least one user-owned payment method.
        // If none exist, ensureSellPaymentMethodExists() creates one via the API.
        if (apiBase) {
            await adsPage.ensureSellPaymentMethodExists(apiBase);
        }
    });

    test("VERIFY a Sell ad can be created through the 3-step wizard and the success screen is shown", async ({
        adsPage,
        adsCreatePage,
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
        // Switch trade type from the default "Buy" to "Sell"
        await adsCreatePage.verifyStep0Visible();
        await adsCreatePage.selectSellAdType();
        await adsCreatePage.fillAdStep0Rate(rate);
        await adsCreatePage.proceedToStep1();

        // Step 1 — Set amount and payment
        // Sell ads open payment selection via an AlertDialog (no sheet testid); use the sell-specific method.
        await adsCreatePage.verifyStep1Visible();
        await adsCreatePage.fillAdStep1Amounts("1000", minOrder, maxOrder);
        await adsCreatePage.selectFirstPaymentMethodSellAd();
        await adsCreatePage.proceedToStep2();

        // Step 2 — Set ad conditions (order time limit pre-selected; no change needed)
        await adsCreatePage.verifyStep2Visible();
        await adsCreatePage.proceedToReview();
        await adsCreatePage.submitCreateAd();

        // Success screen confirms the ad was created
        await adsCreatePage.verifySuccessScreen();

        // Navigate to My Ads via the success screen button and verify the sell ad is listed.
        // We verify here rather than the marketplace Buy tab because sell ads require the
        // account to have P2P crypto balance (≥ total_amount) to appear in the marketplace —
        // an inactive sell ad won't show there. My Ads shows the ad regardless of active status.
        await adsCreatePage.goToMyAdsButton.click();
        await adsPage.verifyAdOnMyAds(rate);
    });
});
