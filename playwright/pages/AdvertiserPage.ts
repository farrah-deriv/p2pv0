import { Page, Locator, expect } from "@playwright/test";

/**
 * AdvertiserPage - Handles all interactions on the Advertiser profile page (`/advertiser/[id]`).
 *
 * @example
 * ```typescript
 * const advertiserPage = new AdvertiserPage(page);
 * await advertiserPage.gotoAdvertiserPage("123");
 * await advertiserPage.verifyAdvertiserPageLoaded();
 * ```
 */
export class AdvertiserPage {
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

    /** Advertiser display name heading */
    get advertiserName(): Locator {
        return this.page.getByTestId("advertiser-name");
    }

    /** Advertiser rating */
    get advertiserRating(): Locator {
        return this.page.getByTestId("advertiser-rating");
    }

    /** Buy ads list on the advertiser profile */
    get buyAdsList(): Locator {
        return this.page.getByTestId("advertiser-buy-ads");
    }

    /** Sell ads list on the advertiser profile */
    get sellAdsList(): Locator {
        return this.page.getByTestId("advertiser-sell-ads");
    }

    /** Block advertiser button */
    get blockButton(): Locator {
        return this.page.getByTestId("advertiser-btn-block");
    }

    // ============================================
    // ACTIONS
    // ============================================

    /**
     * Navigate to an advertiser's profile page.
     *
     * @param advertiserId - The advertiser's ID
     */
    async gotoAdvertiserPage(advertiserId: string): Promise<void> {
        await this.page.goto(`/advertiser/${advertiserId}`);
        await this.page.waitForLoadState("domcontentloaded");
    }

    // ============================================
    // VERIFICATIONS
    // ============================================

    /**
     * Assert the advertiser profile page has loaded.
     */
    async verifyAdvertiserPageLoaded(): Promise<void> {
        await expect(this.advertiserName, "Advertiser name should be visible on profile page").toBeVisible();
    }
}
