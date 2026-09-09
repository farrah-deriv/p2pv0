import { Page, Locator, expect } from "@playwright/test";

/**
 * ProfilePage - Handles all interactions on the user profile page (`/profile`).
 *
 * @example
 * ```typescript
 * const profilePage = new ProfilePage(page);
 * await profilePage.gotoProfilePage();
 * await profilePage.verifyProfilePageLoaded();
 * ```
 */
export class ProfilePage {
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

    /** User display name */
    get displayName(): Locator {
        return this.page.getByTestId("profile-display-name");
    }

    /** Edit nickname button */
    get editNicknameButton(): Locator {
        return this.page.getByTestId("profile-btn-edit-nickname");
    }

    /** Payment methods section */
    get paymentMethodsSection(): Locator {
        return this.page.getByTestId("profile-payment-methods");
    }

    /** Add payment method button */
    get addPaymentMethodButton(): Locator {
        return this.page.getByTestId("profile-btn-add-payment-method");
    }

    /** Stats: completion rate */
    get completionRate(): Locator {
        return this.page.getByTestId("profile-stat-completion-rate");
    }

    /** Stats: total orders */
    get totalOrders(): Locator {
        return this.page.getByTestId("profile-stat-total-orders");
    }

    // ============================================
    // ACTIONS
    // ============================================

    /**
     * Navigate directly to the profile page.
     */
    async gotoProfilePage(): Promise<void> {
        await this.page.goto("/profile");
        await this.page.waitForLoadState("domcontentloaded");
    }

    // ============================================
    // VERIFICATIONS
    // ============================================

    /**
     * Assert the profile page has loaded with core elements visible.
     */
    async verifyProfilePageLoaded(): Promise<void> {
        await expect(this.displayName, "Display name should be visible on profile page").toBeVisible();
    }
}
