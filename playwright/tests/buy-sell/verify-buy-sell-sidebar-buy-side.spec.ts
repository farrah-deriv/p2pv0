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
test.describe("Buy-sell — Buy-side order sidebar", { tag: ["@buy-sell", "@smoke", "@staging", "@desktop", "@mobile"] }, () => {
    test.beforeEach(async ({ loginPage }) => {
        // loginPage.login() validates TEST_EMAIL / TEST_PASSWORD internally
        await loginPage.login();
    });

    test("VERIFY buy-side order sidebar opens with correct content, place order is gated on amount entry, and sidebar closes", async ({
        marketPage,
    }) => {
        // Navigate to the market page using IDR — this currency reliably has active
        // Sell-type ads from other test accounts on staging. The Sell-type ads are the
        // ones that appear on the Buy tab and allow the buyer to open the order sidebar.
        // The seller's ad created by setup-sell-ad cannot be relied on here because sell
        // ads are inactive (hidden from the market) when the seller has zero P2P balance.
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
