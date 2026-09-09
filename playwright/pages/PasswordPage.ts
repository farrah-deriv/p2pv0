import { Page, Locator, expect } from "@playwright/test";

/**
 * PasswordPage - Handles all interactions on the /enter-password page (Ory Kratos step 2).
 *
 * @example
 * ```typescript
 * await passwordPage.verifyEnterPasswordPageElements();
 * await passwordPage.enterPassword(process.env.TEST_PASSWORD!);
 * await passwordPage.submitPassword();
 * ```
 */
export class PasswordPage {
    readonly page: Page;

    constructor(page: Page) {
        this.page = page;
    }

    // ============================================
    // LOCATORS
    // ============================================

    /** Page heading on /enter-password */
    get enterPasswordHeading(): Locator {
        return this.page.getByTestId("enter-password-heading");
    }

    /** Displayed email address below the heading */
    get emailLabel(): Locator {
        return this.page.getByTestId("enter-password-text-email");
    }

    /** Password input container */
    get passwordInput(): Locator {
        return this.page.getByTestId("enter-password-input-password");
    }

    /** Log in submit button */
    get logInButton(): Locator {
        return this.page.getByTestId("enter-password-btn-submit").getByRole("button").first();
    }

    /** "Forgot password?" button */
    get forgotPasswordButton(): Locator {
        return this.page.getByTestId("enter-password-btn-forgot-password");
    }

    /** "Try another verification method" button */
    get tryAnotherMethodButton(): Locator {
        return this.page.getByTestId("enter-password-btn-try-another-method").getByRole("button").first();
    }

    /** "Go back" button in the auth header */
    get goBackButton(): Locator {
        return this.page.getByTestId("auth-btn-back");
    }

    /** Language switcher button in the auth header */
    get languageSwitcher(): Locator {
        return this.page.getByTestId("auth-language-btn");
    }

    /** Live chat button in the auth header */
    get liveChatButton(): Locator {
        return this.page.getByTestId("auth-btn-live-chat");
    }

    /** Inline credentials error shown below the password input after a failed login */
    get credentialsError(): Locator {
        return this.page.getByTestId("enter-password-input-password").locator("[role='alert']").first();
    }

    // ============================================
    // ACTIONS
    // ============================================

    /** Wait for the enter-password page to fully load */
    async waitForPasswordPageToLoad(): Promise<void> {
        await this.page.waitForLoadState("domcontentloaded");
        await this.enterPasswordHeading.waitFor({ state: "visible" });
    }

    /** Click the password area to reveal the input, then fill the password */
    async enterPassword(password: string): Promise<void> {
        await this.passwordInput.click();
        await this.passwordInput.locator("input").fill(password);
    }

    /**
     * Submit the password form via Enter key.
     * Uses keyboard submit — Turnstile may keep the button disabled in headless CI.
     */
    async submitPassword(): Promise<void> {
        await this.passwordInput.locator("input").press("Enter");
    }

    /** Enter the password and submit */
    async enterPasswordAndSubmit(password: string): Promise<void> {
        await this.enterPassword(password);
        await this.submitPassword();
    }

    // ============================================
    // VERIFICATIONS
    // ============================================

    /** Assert that all expected elements on the enter-password page are visible */
    async verifyEnterPasswordPageElements(): Promise<void> {
        await expect(this.enterPasswordHeading, 'Password page heading should be visible').toBeVisible();
        await expect(this.emailLabel, 'Email label showing the account email should be visible').toBeVisible();
        await expect(this.passwordInput, 'Password input should be visible').toBeVisible();
        await expect(this.logInButton, '"Log in" submit button should be visible').toBeVisible();
        await expect(this.forgotPasswordButton, '"Forgot password?" button should be visible').toBeVisible();
        await expect(this.tryAnotherMethodButton, '"Try another verification method" button should be visible').toBeVisible();
        await expect(this.goBackButton, '"Go back" button should be visible').toBeVisible();
        await expect(this.languageSwitcher, 'Language switcher button should be visible').toBeVisible();
        await expect(this.liveChatButton, 'Live chat button should be visible').toBeVisible();
    }
}
