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
test.describe("Buy-sell — Sell-side order sidebar", { tag: ["@buy-sell", "@smoke", "@staging", "@desktop", "@mobile"] }, () => {
    test.beforeEach(async ({ loginPage }) => {
        // loginPage.login() validates TEST_EMAIL / TEST_PASSWORD internally
        await loginPage.login();
    });

    test("VERIFY sell-side order sidebar shows payment selection and place order remains disabled without a selected payment method", async ({
        marketPage,
    }) => {
        // Navigate to market page with IDR — IDR has active buy-type ads on the Sell tab on staging
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
