/**
 * @name     Sell-side order sidebar — content verification and payment method required guard
 * @id       flow-2
 * @flow     playwright/flows/buy-sell/flow.md#flow-2
 * @coverage playwright/flows/buy-sell/coverage.md
 *
 * NOTE: Test folder is `playwright/tests/buy-sell/` rather than `playwright/tests/market/`
 * because the order sidebar is a distinct feature area from market browsing.
 * See playwright/flows/buy-sell/catalog.md — Decision D5 for the full rationale.
 */
import { test, expect } from "../../fixtures/fixtures";

/**
 * Flow 2 — Sell-side order sidebar: content verification and payment method required guard.
 *
 * Prerequisites: At least one buy-type ad visible on the Sell tab; logged-in user has at
 * least one payment method configured; user is KYC-verified and is NOT the advertiser.
 */
// Serial mode: shares TEST_EMAIL_SELLER with verify-buy-sell-sidebar-buy-side; parallel
// logins invalidate each other's session ("Notifications error" — Create ad then no-ops).
test.describe.configure({ mode: "serial" });
test.describe("Buy-sell — Sell-side order sidebar", { tag: ["@buy-sell", "@smoke", "@staging", "@desktop", "@mobile"] }, () => {
    test.beforeEach(async ({ page, loginPage, adsPage, adsCreatePage }, testInfo) => {
        // The market's IDR Sell-tab inventory is shared, external staging state — a prior
        // run's ad may have been deleted, or IDR may simply have no other seller's Buy-type
        // ad live at run time (same class of failure as verify-buy-sell-sidebar-buy-side.spec.ts
        // — see that spec for the full incident). Guarantee a Buy-type IDR ad exists by
        // creating one as the dedicated seller account first.
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
        // Distinct from the Sell-type IDR ad rates used in
        // verify-buy-sell-sidebar-buy-side.spec.ts (17600/17601) purely for clarity when
        // inspecting the seller account — different trade type (buy vs sell) means no
        // overlap risk between the two specs' ads regardless of rate.
        // Project-specific rates AND order-limit ranges (desktop vs mobile) avoid duplicate
        // and overlapping-range collisions when chromium and chromium-mobile run this
        // beforeEach in parallel against the same seller account (same pattern as
        // ads/verify-create-sell-ad.spec.ts). Both ranges stay within the seller account's
        // known P2P balance (1,000 USD) and don't overlap: desktop 10–100, mobile 101–250.
        // Calibrated 2026-09 against IDR/USD ~17,500. Re-verify if IDR spot rate shifts > 500 pts
        // (test will start failing at ad creation with the "Check your fixed rate" dialog).
        const isMobile = testInfo.project.name.includes("mobile");
        const setupAdRate = isMobile ? "17701.00" : "17700.00";
        const setupMinOrder = isMobile ? "101" : "10";
        const setupMaxOrder = isMobile ? "250" : "100";

        // Seller session — create the Buy-type setup ad
        await loginPage.login(sellerEmail);

        // Delete only this project's own rate first — avoids duplicate-rate rejection on
        // rerun, and is scoped so the other project's IDR ad (different rate/range) is
        // never touched when both projects run in parallel. The returned apiBase is
        // intentionally unused here — unlike the Sell-type setup ad in
        // verify-buy-sell-sidebar-buy-side.spec.ts, Buy ads use global payment method types
        // and need no ensureSellPaymentMethodExists() call.
        await adsPage.deleteAdsByRate(setupAdRate);

        await adsPage.gotoAdsPage();
        await adsPage.clickCreateAd();

        // Buy is the default trade type in the wizard — select explicitly for clarity and
        // to guard against a future default change.
        await adsCreatePage.verifyStep0Visible();
        await adsCreatePage.selectBuyAdType();
        await adsCreatePage.selectPaymentCurrency("IDR");
        await adsCreatePage.fillAdStep0Rate(setupAdRate);
        await adsCreatePage.proceedToStep1();

        // Buy ads use global payment method types (not user-owned methods), so unlike the
        // Sell-type setup ad in verify-buy-sell-sidebar-buy-side.spec.ts, no
        // ensureSellPaymentMethodExists() call is needed here.
        await adsCreatePage.verifyStep1Visible();
        await adsCreatePage.fillAdStep1Amounts("500", setupMinOrder, setupMaxOrder);
        await adsCreatePage.selectFirstPaymentMethod();
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

    test("VERIFY sell-side order sidebar shows payment selection and place order remains disabled without a selected payment method", async ({
        marketPage,
    }) => {
        // Navigate to market page with IDR — the beforeEach above guarantees an active
        // Buy-type IDR ad exists (created via TEST_EMAIL_SELLER), so the Sell tab always
        // has at least one ad to open the order sidebar from.
        await marketPage.gotoMarketPage("IDR");
        await expect(marketPage.sellTab, "Sell tab should be visible on the market page").toBeVisible();
        await marketPage.clickSellTab();
        await expect(marketPage.sellTab, "Sell tab should become active after clicking").toHaveAttribute("data-state", "active");

        // Open the order sidebar by clicking the first "Sell {currency}" button
        await marketPage.clickFirstSellButton();

        // Sidebar opens
        await expect(marketPage.orderSidebarContainer, "Order sidebar should open after clicking Sell button").toBeVisible({ timeout: 8000 });

        // Sidebar title contains "Sell {currency}" (e.g. "Sell USD")
        await expect(marketPage.orderSidebarTitleSellSide, "Sidebar title should contain 'Sell {currency}'").toBeVisible();

        // "You receive" label confirms this is the sell-side flow (buy-type ad, orderType="buy", isBuy=true)
        await expect(marketPage.orderSidebarLabelYouReceive, "You receive label should be visible on the sell-side sidebar").toBeVisible();

        // Payment selection IS present on sell-side (only rendered when isBuy === true — catalog D3)
        await expect(marketPage.orderSidebarBtnSelectPayment, "Payment selection button should be visible on the sell-side sidebar").toBeVisible();

        // Place order is disabled when neither amount nor payment method is selected
        await expect(marketPage.orderSidebarBtnPlaceOrder, "Place order button should be disabled when no amount and no payment method are selected").toBeDisabled();

        // Entering a valid amount alone is NOT sufficient — payment method is also required.
        // fillMinOrderAmount() reads the live order limit from the sidebar so the amount is
        // always in range regardless of staging ad changes. Button must still be disabled
        // because no payment method has been selected.
        await marketPage.fillMinOrderAmount();
        await expect(marketPage.orderSidebarBtnPlaceOrder, "Place order button should remain disabled after entering amount without selecting a payment method").toBeDisabled();
    });
});
