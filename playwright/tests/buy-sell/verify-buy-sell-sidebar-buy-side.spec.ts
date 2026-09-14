/**
 * @name     Buy-side order sidebar — content verification, place-order guard, and close
 * @id       flow-1
 * @flow     playwright/flows/buy-sell/flow.md#flow-1
 * @coverage playwright/flows/buy-sell/coverage.md
 *
 * NOTE: Test folder is `playwright/tests/buy-sell/` rather than `playwright/tests/market/`
 * because the order sidebar is a distinct feature area from market browsing.
 * See playwright/flows/buy-sell/catalog.md — Decision D5 for the full rationale.
 */
import { test, expect } from "../../fixtures/fixtures";

/**
 * Flow 1 — Buy-side order sidebar: content verification, place-order guard, and close.
 *
 * Prerequisites: At least one sell-type ad visible on the Buy tab; logged-in user is
 * KYC-verified and is NOT the advertiser of that ad.
 */
// Serial mode: shares TEST_EMAIL_SELLER with verify-buy-sell-sidebar-sell-side; parallel
// logins invalidate each other's session ("Notifications error" — Create ad then no-ops).
test.describe.configure({ mode: "serial" });
test.describe("Buy-sell — Buy-side order sidebar", { tag: ["@buy-sell", "@smoke", "@staging", "@desktop", "@mobile"] }, () => {
    test.beforeEach(async ({ page, loginPage, adsPage, adsCreatePage }, testInfo) => {
        // The market's IDR Buy-tab inventory is shared, external staging state — a prior
        // run's ad may have been deleted, or IDR may simply have no other seller's ad live
        // at run time (this test was failing for exactly that reason). Guarantee a Sell-type
        // IDR ad exists by creating one as the dedicated seller account first.
        //
        // The seller setup runs in the SAME page/context as the buyer flow — logging the
        // seller in from a second concurrent context makes staging's notification service
        // reject one of the two simultaneous sessions ("Notifications error" in the header,
        // after which the Create ad click silently fails). Instead: login as seller →
        // create the ad → clear cookies (the staging build has no in-app logout control —
        // DevLogoutButton only renders under NODE_ENV=development) → login as buyer.
        const sellerEmail = process.env.TEST_EMAIL_SELLER;
        if (!sellerEmail) throw new Error("TEST_EMAIL_SELLER not set in playwright/.env.staging");

        // Fixed IDR/USD rate for the seller's setup ad. Realistic relative to IDR's real
        // market rate (~17,500) — the app rejects fixed rates too far from the live market
        // price ("Check your fixed rate" dialog), so an arbitrary placeholder is rejected.
        // Project-specific rates AND order-limit ranges (desktop vs mobile) avoid duplicate
        // and overlapping-range collisions when chromium and chromium-mobile run this
        // beforeEach in parallel against the same seller account (same pattern as
        // ads/verify-create-sell-ad.spec.ts). Both ranges stay within the seller account's
        // known P2P balance (1,000 USD) and don't overlap: desktop 10–100, mobile 101–250.
        // Calibrated 2026-09 against IDR/USD ~17,500. Re-verify if IDR spot rate shifts > 500 pts
        // (test will start failing at ad creation with the "Check your fixed rate" dialog).
        const isMobile = testInfo.project.name.includes("mobile");
        const setupAdRate = isMobile ? "17601.00" : "17600.00";
        const setupMinOrder = isMobile ? "101" : "10";
        const setupMaxOrder = isMobile ? "250" : "100";

        // Seller session — create the setup ad
        await loginPage.login(sellerEmail);

        // Delete only this project's own rate first — avoids duplicate-rate rejection on
        // rerun, and is scoped so the other project's IDR ad (different rate/range) is
        // never touched when both projects run in parallel.
        const apiBase = await adsPage.deleteAdsByRate(setupAdRate);
        if (apiBase) {
            await adsPage.ensureSellPaymentMethodExists(apiBase);
        } else {
            // deleteAdsByRate couldn't intercept the adverts response, so we can't confirm
            // (or fix) the seller's payment methods here. If the account genuinely has none,
            // selectFirstPaymentMethodSellAd() below will fail on a missing checkbox with a
            // confusing locator error instead of a clear cause — this log gives that failure
            // a starting point.
            console.warn(
                "[verify-buy-sell-sidebar-buy-side beforeEach] Could not intercept adverts " +
                "response — ensureSellPaymentMethodExists skipped. If selectFirstPaymentMethodSellAd " +
                "fails below, check TEST_EMAIL_SELLER has at least one saved payment method."
            );
        }

        await adsPage.gotoAdsPage();
        await adsPage.clickCreateAd();

        await adsCreatePage.verifyStep0Visible();
        await adsCreatePage.selectSellAdType();
        await adsCreatePage.selectPaymentCurrency("IDR");
        await adsCreatePage.fillAdStep0Rate(setupAdRate);
        await adsCreatePage.proceedToStep1();

        await adsCreatePage.verifyStep1Visible();
        await adsCreatePage.fillAdStep1Amounts("500", setupMinOrder, setupMaxOrder);
        await adsCreatePage.selectFirstPaymentMethodSellAd();
        await adsCreatePage.proceedToStep2();

        await adsCreatePage.verifyStep2Visible();
        await adsCreatePage.submitCreateAd();
        await adsCreatePage.verifySuccessScreen();

        // "Logout" the seller — clear all session cookies in this context. Staging has no
        // in-app logout control, and this is the same mechanism DevLogoutButton relies on
        // server-side: without cookies, the next login() starts a fresh Kratos session.
        await page.context().clearCookies();

        // loginPage.login() validates TEST_EMAIL / TEST_PASSWORD internally
        await loginPage.login();
    });

    test("VERIFY buy-side order sidebar opens with correct content, place order is gated on amount entry, and sidebar closes", async ({
        marketPage,
    }) => {
        // Navigate to the market page using IDR — the beforeEach above guarantees an active
        // Sell-type IDR ad exists (created via TEST_EMAIL_SELLER), so the Buy tab always has
        // at least one ad to open the order sidebar from, independent of other staging state.
        await marketPage.gotoMarketPage("IDR");
        await expect(marketPage.buyTab, "Buy tab should be active by default on the market page").toHaveAttribute("data-state", "active");

        // Open the order sidebar by clicking the first "Buy {currency}" button
        await marketPage.clickFirstBuyButton();

        // Sidebar opens as a full-screen overlay div (not a Dialog — catalog D2)
        await expect(marketPage.orderSidebarContainer, "Order sidebar should open as a full-screen overlay").toBeVisible({ timeout: 8000 });

        // Sidebar title contains "Buy {currency}" (e.g. "Buy USD")
        await expect(marketPage.orderSidebarTitleBuySide, "Sidebar title should contain 'Buy {currency}'").toBeVisible();

        // Core content elements are present
        await expect(marketPage.orderSidebarInputAmount, "Amount input should be visible in the sidebar").toBeVisible();
        await expect(marketPage.orderSidebarBtnPlaceOrder, "Place order button should be visible in the sidebar").toBeVisible();
        await expect(marketPage.orderSidebarLabelOrderLimit, "Order limit label should be visible in the sidebar").toBeVisible();

        // "You pay" label confirms this is the buy-side flow (sell-type ad, orderType="sell", isBuy=false)
        await expect(marketPage.orderSidebarLabelYouPay, "You pay label should be visible on the buy-side sidebar").toBeVisible();

        // Payment selection is NOT present on buy-side (only rendered when isBuy === true — catalog D3)
        await expect(marketPage.orderSidebarBtnSelectPayment, "Payment selection button should NOT be visible on the buy-side sidebar").not.toBeVisible();

        // Place order is disabled when no amount has been entered
        await expect(marketPage.orderSidebarBtnPlaceOrder, "Place order button should be disabled when no amount is entered").toBeDisabled();

        // Entering the minimum valid order amount enables Place order.
        // fillMinOrderAmount() reads the live order limit from the sidebar to stay
        // resilient against staging ad limit changes.
        await marketPage.fillMinOrderAmount();
        await expect(marketPage.orderSidebarBtnPlaceOrder, "Place order button should be enabled after entering a valid amount").toBeEnabled();

        // Closing the sidebar removes the overlay
        await marketPage.closeSidebar();
        await expect(marketPage.orderSidebarContainer, "Order sidebar should be closed after clicking the close button").not.toBeVisible();
    });
});
