import { Page, Locator, expect } from "@playwright/test";

/**
 * OrdersPage - Handles all interactions on the Orders list page (`/orders`).
 *
 * @example
 * ```typescript
 * const ordersPage = new OrdersPage(page);
 * await ordersPage.gotoOrdersPage();
 * await ordersPage.verifyOrdersPageLoaded();
 * ```
 */
export class OrdersPage {
    readonly page: Page;

    constructor(page: Page) {
        this.page = page;
    }

    private get isMobile(): boolean {
        return (this.page.viewportSize()?.width ?? 1024) < 1024;
    }

    // ============================================
    // LOCATORS
    // ============================================

    /** Active orders tab */
    get activeOrdersTab(): Locator {
        return this.page.getByTestId("orders-tab-active");
    }

    /** Past orders tab */
    get pastOrdersTab(): Locator {
        return this.page.getByTestId("orders-tab-past");
    }

    /** List of order cards */
    get orderCards(): Locator {
        return this.page.getByTestId("order-card");
    }

    /** Empty state for no active orders */
    get emptyState(): Locator {
        return this.page.getByTestId("orders-empty-state");
    }

    // ============================================
    // ACTIONS
    // ============================================

    /**
     * Navigate directly to the Orders page.
     */
    async gotoOrdersPage(): Promise<void> {
        await this.page.goto("/orders");
        await this.page.waitForLoadState("domcontentloaded");
    }

    /**
     * Click a specific order card by index (0-based).
     *
     * @param index - Index of the order card to click
     */
    async clickOrderCard(index: number = 0): Promise<void> {
        await expect(this.orderCards.nth(index), `Order card at index ${index} should be visible`).toBeVisible();
        await this.orderCards.nth(index).click();
    }

    /**
     * Switch to the Past orders tab.
     */
    async switchToPastOrders(): Promise<void> {
        await this.pastOrdersTab.click();
    }

    // ============================================
    // VERIFICATIONS
    // ============================================

    /**
     * Assert the Orders page has loaded.
     */
    async verifyOrdersPageLoaded(): Promise<void> {
        await expect(this.activeOrdersTab, "Active orders tab should be visible").toBeVisible();
        await expect(this.pastOrdersTab, "Past orders tab should be visible").toBeVisible();
    }
}
