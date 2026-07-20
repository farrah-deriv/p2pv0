import { Page, Locator, expect } from "@playwright/test";

/**
 * MarketPage - Handles all interactions on the P2P Markets home page (`/`).
 *
 * @example
 * ```typescript
 * const marketPage = new MarketPage(page);
 * await marketPage.gotoMarketPage();
 * await marketPage.verifyMarketPageLoaded();
 * ```
 */
export class MarketPage {
    readonly page: Page;

    constructor(page: Page) {
        this.page = page;
    }

    // ============================================
    // LOCATORS
    // ============================================

    /** Buy tab in the market filter */
    get buyTab(): Locator {
        return this.page.getByRole("tablist").getByTestId("markets-tab-buy");
    }

    /** Sell tab in the market filter */
    get sellTab(): Locator {
        return this.page.getByRole("tablist").getByTestId("markets-tab-sell");
    }

    /** Currency filter/selector */
    get currencyFilter(): Locator {
        return this.page.getByTestId("market-filter-currency");
    }

    /** Payment method filter */
    get paymentMethodFilter(): Locator {
        return this.page.getByTestId("market-filter-payment-method");
    }

    /** List of ad cards on the market page */
    get adCards(): Locator {
        return this.page.getByTestId("market-ad-card");
    }

    /** Empty state shown when no ads match the filter */
    get emptyState(): Locator {
        return this.page.getByTestId("market-empty-state");
    }

    /** Navigation link to My Ads */
    get myAdsNavLink(): Locator {
        return this.page.getByTestId("nav-link-ads");
    }

    /** Navigation link to Orders */
    get ordersNavLink(): Locator {
        return this.page.getByTestId("nav-link-orders");
    }

    /** Navigation link to Profile */
    get profileNavLink(): Locator {
        return this.page.getByTestId("nav-link-profile");
    }

    /** Navigation link to Wallet */
    get walletNavLink(): Locator {
        return this.page.getByTestId("nav-link-wallet");
    }

    // -- Order sidebar (buy-sell overlay on the same route `/`) ----------

    /** Root container of the order sidebar — full-screen overlay div, NOT a Dialog (see catalog D2) */
    get orderSidebarContainer(): Locator {
        return this.page.getByTestId("order-sidebar-container");
    }

    /** Close (×) button inside the order sidebar */
    get orderSidebarBtnClose(): Locator {
        return this.page.getByTestId("order-sidebar-btn-close");
    }

    /** Amount input inside the order sidebar */
    get orderSidebarInputAmount(): Locator {
        return this.page.getByTestId("order-sidebar-input-amount");
    }

    /** Place order button inside the order sidebar */
    get orderSidebarBtnPlaceOrder(): Locator {
        return this.page.getByTestId("order-sidebar-btn-place-order");
    }

    /**
     * Payment method selection button — only rendered when `isBuy === true` (sell-side flow).
     * On buy-side this element is absent from the DOM entirely (catalog D3).
     */
    get orderSidebarBtnSelectPayment(): Locator {
        return this.page.getByTestId("order-sidebar-btn-select-payment");
    }

    /** Sidebar heading matching "Buy {currency}" — scoped to sidebar container */
    get orderSidebarTitleBuySide(): Locator {
        return this.orderSidebarContainer.getByText(/Buy\s+\w+/).first();
    }

    /** Sidebar heading matching "Sell {currency}" — scoped to sidebar container */
    get orderSidebarTitleSellSide(): Locator {
        return this.orderSidebarContainer.getByText(/Sell\s+\w+/).first();
    }

    /** "You receive" label — visible on the sell-side sidebar (buy-type ad: orderType="buy", isBuy=true) */
    get orderSidebarLabelYouReceive(): Locator {
        return this.orderSidebarContainer.getByText("You receive");
    }

    /** "You pay" label — visible on the buy-side sidebar (sell-type ad: orderType="sell", isBuy=false) */
    get orderSidebarLabelYouPay(): Locator {
        return this.orderSidebarContainer.getByText("You pay");
    }

    /** "Order limit" label in the order sidebar */
    get orderSidebarLabelOrderLimit(): Locator {
        return this.orderSidebarContainer.getByText("Order limit");
    }

    /**
     * The div row containing the "Order limit" label and its value span.
     * textContent yields e.g. "Order limit1.00 - 10.00 USD" — use to parse the min/max.
     */
    get orderSidebarOrderLimitRow(): Locator {
        return this.orderSidebarContainer
            .locator("div")
            .filter({ has: this.page.getByText("Order limit") })
            .first();
    }

    /**
     * First "Buy {currency}" action button in the ad list.
     * Uses the `data-testid` prefix pattern so it is locale-independent.
     * Only present on the Buy tab (sell-type ads).
     * filter({ visible: true }) is required because the page renders both desktop and
     * mobile layouts simultaneously; without it .first() picks the hidden layout's button.
     */
    get firstBuyButton(): Locator {
        return this.page.locator("[data-testid^='markets-btn-buy-']").filter({ visible: true }).first();
    }

    /**
     * First "Sell {currency}" action button in the ad list.
     * Uses the `data-testid` prefix pattern so it is locale-independent.
     * Only present on the Sell tab (buy-type ads).
     * filter({ visible: true }) is required because the page renders both desktop and
     * mobile layouts simultaneously; without it .first() picks the hidden layout's button.
     */
    get firstSellButton(): Locator {
        return this.page.locator("[data-testid^='markets-btn-sell-']").filter({ visible: true }).first();
    }

    /**
     * Locate an ad card on the market list by its rate value.
     * Filters to visible only — the app renders both desktop and mobile layouts
     * simultaneously (hidden via CSS), so the same card testid exists twice in the DOM.
     * @param rate - Rate text to match, e.g. "1.50"
     */
    adCardByRate(rate: string): Locator {
        return this.page
            .locator("[data-testid^='markets-card-ad-']")
            .filter({ has: this.page.locator("[data-testid^='markets-text-rate-']").filter({ hasText: rate }) })
            .filter({ visible: true });
    }

    /**
     * Rate display element for the ad matching the given rate value.
     * Uses `.first()` because both desktop and mobile layouts render the same element;
     * pairing with `adCardByRate`'s `visible: true` filter is preferred for strict assertions.
     * @param rate - Rate text to match, e.g. "1.50"
     */
    adRateByRate(rate: string): Locator {
        return this.adCardByRate(rate).locator("[data-testid^='markets-text-rate-']");
    }

    /**
     * Order limits display element inside the ad card for the given rate value.
     * Format rendered: "Order limits: {min} - {max}  {accountCurrency}"
     * @param rate - Rate text to match the parent card, e.g. "1.50"
     */
    adLimitsByRate(rate: string): Locator {
        return this.adCardByRate(rate).locator("[data-testid^='markets-text-limits-']");
    }

    // ============================================
    // ACTIONS
    // ============================================

    /**
     * Dismiss the P2P onboarding guide dialog if it is currently open.
     *
     * The guide (a 5-step walkthrough, aria-labelledby="p2p-guide-title") covers the
     * full viewport with pointer-events-auto, blocking all tab clicks until closed.
     * It appears on the first market page visit in each test session.
     * The close button carries aria-label "Close guide" and renders as "✕".
     */
    private async dismissGuideIfVisible(): Promise<void> {
        const closeButton = this.page.getByRole("button", { name: "Close guide" });
        try {
            await closeButton.waitFor({ state: "visible", timeout: 4000 });
            await closeButton.click();
            await this.page
                .locator('[aria-labelledby="p2p-guide-title"]')
                .waitFor({ state: "hidden", timeout: 5000 });
        } catch {
            // Guide not present — nothing to do
        }
    }

    /**
     * Navigate to the P2P market page and select a currency.
     * Defaults to IDR which has active sell-type ads on staging.
     * @param currency - 3-letter currency code (default: "IDR")
     */
    async gotoMarketPage(currency: string = "IDR"): Promise<void> {
        await this.page.goto("/");
        await this.page.waitForLoadState("domcontentloaded");
        await this.dismissGuideIfVisible();
        await this.selectCurrency(currency);
    }

    /**
     * Navigate to the market home page without forcing a currency selection.
     * The app will auto-select the currency based on the user's profile localCurrency.
     * Use this when the test account's currency should drive what ads are visible
     * (e.g. verifying a just-created ad appears in the market).
     */
    async gotoMarketPageDefault(): Promise<void> {
        await this.page.goto("/");
        await this.page.waitForLoadState("domcontentloaded");
        await this.dismissGuideIfVisible();
    }

    /**
     * Select a currency using the currency filter dropdown.
     * Clicks the trigger button then selects the matching currency row by code text.
     * @param currencyCode - 3-letter code (e.g. "USD", "EUR")
     */
    async selectCurrency(currencyCode: string): Promise<void> {
        // Two triggers exist (desktop and mobile layout) — filter to the one currently
        // visible so mobile viewport picks the mobile button rather than the hidden desktop one.
        const trigger = this.page.getByTestId("currency-filter-btn-trigger").filter({ visible: true }).first();
        await expect(trigger, "Currency filter trigger should be visible").toBeVisible();
        await trigger.click();
        // Rows display "{code} - {name}"; match by the code prefix to stay locale-independent
        await this.page
            .locator(`[data-testid^="currency-filter-btn-"]`)
            .filter({ hasText: new RegExp(`^${currencyCode}\\b`) })
            .first()
            .click();
    }

    /**
     * Click the Buy tab to view buy ads.
     */
    async clickBuyTab(): Promise<void> {
        await expect(this.buyTab, "Buy tab should be visible").toBeVisible();
        await this.buyTab.click();
    }

    /**
     * Click the Sell tab to view sell ads.
     */
    async clickSellTab(): Promise<void> {
        await expect(this.sellTab, "Sell tab should be visible").toBeVisible();
        await this.sellTab.click();
    }

    /**
     * Navigate to My Ads via the nav link.
     */
    async navigateToMyAds(): Promise<void> {
        await this.myAdsNavLink.click();
        await this.page.waitForURL(/\/ads/);
    }

    /**
     * Navigate to Orders via the nav link.
     */
    async navigateToOrders(): Promise<void> {
        await this.ordersNavLink.click();
        await this.page.waitForURL(/\/orders/);
    }

    /**
     * Navigate to Profile via the nav link.
     */
    async navigateToProfile(): Promise<void> {
        await this.profileNavLink.click();
        await this.page.waitForURL(/\/profile/);
    }

    /**
     * Click the first "Buy {currency}" action button in the ad list.
     * Asserts visibility first to surface missing-ad failures clearly.
     */
    async clickFirstBuyButton(): Promise<void> {
        await expect(this.firstBuyButton, "First Buy button should be visible on the market page").toBeVisible();
        await this.firstBuyButton.click();
    }

    /**
     * Click the first "Sell {currency}" action button in the ad list.
     * Asserts visibility first to surface missing-ad failures clearly.
     */
    async clickFirstSellButton(): Promise<void> {
        await expect(this.firstSellButton, "First Sell button should be visible on the market page").toBeVisible();
        await this.firstSellButton.click();
    }

    /**
     * Fill the amount input in the order sidebar.
     * @param amount - The value to type (e.g. "50")
     */
    async fillOrderAmount(amount: string): Promise<void> {
        await expect(this.orderSidebarInputAmount, "Amount input should be visible before filling").toBeVisible();
        await this.orderSidebarInputAmount.fill(amount);
    }

    /**
     * Fill the sidebar amount input with the minimum valid order amount read from the
     * order limit row (e.g. "Order limit 1.00 - 10.00 USD" → fills "1.00").
     *
     * Prefer this over a hardcoded amount in tests because staging ad order limits vary
     * and a hardcoded value may go out of range, keeping the Place order button disabled.
     */
    async fillMinOrderAmount(): Promise<void> {
        const rowText = await this.orderSidebarOrderLimitRow.textContent() ?? "";
        // "Order limit1.00 - 10.00 USD" — extract the first decimal number before " - "
        const match = rowText.match(/(\d+(?:\.\d+)?)\s*-/);
        const minAmount = match?.[1] ?? "1";
        await this.fillOrderAmount(minAmount);
    }

    /**
     * Close the order sidebar by clicking the close (×) button.
     */
    async closeSidebar(): Promise<void> {
        await expect(this.orderSidebarBtnClose, "Sidebar close button should be visible").toBeVisible();
        await this.orderSidebarBtnClose.click();
    }

    // ============================================
    // VERIFICATIONS
    // ============================================

    /**
     * Assert the market page has loaded with the core elements visible.
     */
    async verifyMarketPageLoaded(): Promise<void> {
        await expect(this.buyTab, "Buy tab should be visible on market page").toBeVisible();
        await expect(this.sellTab, "Sell tab should be visible on market page").toBeVisible();
    }

    /**
     * Switch to the Buy tab and assert that a Sell-type ad is visible with the
     * expected rate and order limits.
     *
     * The Buy tab shows Sell-type ads (advertisers who want to sell, so users can buy from them).
     * A newly created Sell ad should therefore appear here.
     *
     * @param rate            - Rate value as entered in the wizard, e.g. "1.50"
     * @param minOrder        - Expected minimum order amount, e.g. "10.00"
     * @param maxOrder        - Expected maximum order amount, e.g. "500.00"
     * @param accountCurrency - Account currency code expected in the limits string, e.g. "USD"
     */
    async verifyAdOnBuyTab(
        rate: string,
        minOrder: string,
        maxOrder: string,
        accountCurrency: string
    ): Promise<void> {
        await this.clickBuyTab();

        await expect(
            this.adRateByRate(rate),
            `Ad with rate "${rate}" should be visible on the Buy tab`
        ).toBeVisible();

        await expect(
            this.adLimitsByRate(rate),
            `Ad limits for rate "${rate}" should contain order range "${minOrder} - ${maxOrder}"`
        ).toContainText(`${minOrder} - ${maxOrder}`);

        await expect(
            this.adLimitsByRate(rate),
            `Ad limits for rate "${rate}" should contain account currency "${accountCurrency}"`
        ).toContainText(accountCurrency);
    }

    /**
     * Switch to the Sell tab and assert that a Buy-type ad is visible with the
     * expected rate and order limits.
     *
     * The Sell tab shows Buy-type ads (advertisers who want to buy, so users can sell to them).
     * A newly created Buy ad should therefore appear here.
     *
     * Rate display format  : "{rate} {paymentCurrency} /{accountCurrency}"  (e.g. "1.50 BAM /USD")
     * Limits display format: "Order limits: {min} - {max}  {accountCurrency}" (double space before currency)
     *
     * @param rate            - Rate value as entered in the wizard, e.g. "1.50"
     * @param minOrder        - Expected minimum order amount, e.g. "10"
     * @param maxOrder        - Expected maximum order amount, e.g. "500"
     * @param accountCurrency - Account currency code expected in the limits string, e.g. "USD"
     */
    async verifyAdOnSellTab(
        rate: string,
        minOrder: string,
        maxOrder: string,
        accountCurrency: string
    ): Promise<void> {
        await this.clickSellTab();

        await expect(
            this.adRateByRate(rate),
            `Ad with rate "${rate}" should be visible on the Sell tab`
        ).toBeVisible();

        await expect(
            this.adLimitsByRate(rate),
            `Ad limits for rate "${rate}" should contain order range "${minOrder} - ${maxOrder}"`
        ).toContainText(`${minOrder} - ${maxOrder}`);

        await expect(
            this.adLimitsByRate(rate),
            `Ad limits for rate "${rate}" should contain account currency "${accountCurrency}"`
        ).toContainText(accountCurrency);
    }
}
