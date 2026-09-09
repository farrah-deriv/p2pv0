import { Page, Locator, expect } from "@playwright/test";
import { PasswordPage } from "./PasswordPage";

/**
 * LoginPage - Handles the Ory Kratos login flow for p2p-v0.
 *
 * Flow: staging-home.deriv.com/dashboard/login → email → password →
 * staging-home.deriv.com/dashboard/home → click P2P → staging-p2p.deriv.com/
 *
 * @example
 * ```typescript
 * await loginPage.login(); // handles full flow — do not call steps individually in tests
 * ```
 */
export class LoginPage {
    readonly page: Page;

    constructor(page: Page) {
        this.page = page;
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    /**
     * True when the viewport is below the Tailwind `lg` breakpoint (1024 px).
     * The sidebar is `hidden lg:flex` — not visible on mobile viewports.
     */
    private get isMobile(): boolean {
        return (this.page.viewportSize()?.width ?? 1024) < 1024;
    }

    // ============================================
    // LOCATORS
    // ============================================

    /** "Welcome back!" h1 heading — used as the load-ready signal for the login page */
    get welcomeBackHeading(): Locator {
        return this.page.getByRole("heading", { level: 1 });
    }

    /** Email input container (the clickable field that reveals the native input) */
    get emailInput(): Locator {
        return this.page.getByTestId("login-input-identifier");
    }

    /** Native <input> inside the email input container */
    get emailNativeInput(): Locator {
        return this.emailInput.locator("input");
    }

    /** Visible label that focuses/mounts the identifier input */
    get emailInputLabel(): Locator {
        return this.emailInput.locator("label").first();
    }

    /** Password input field on /enter-password */
    get passwordInput(): Locator {
        return this.page.getByTestId("login-input-password").locator("input");
    }

    /** Log in submit button */
    get logInButton(): Locator {
        return this.page.getByTestId("login-btn-submit").getByRole("button").first();
    }

    /** "Log in with Google" social button */
    get googleButton(): Locator {
        return this.page.getByTestId("social-btn-google");
    }

    /** "Log in with Facebook" social button */
    get facebookButton(): Locator {
        return this.page.getByTestId("social-btn-facebook");
    }

    /** "Log in with Apple" social button */
    get appleButton(): Locator {
        return this.page.getByTestId("social-btn-apple");
    }

    /** "Sign up" link */
    get signUpLink(): Locator {
        return this.page.getByTestId("login-link-signup");
    }

    /** Language switcher button in the auth header */
    get languageSwitcher(): Locator {
        return this.page.getByTestId("auth-language-btn");
    }

    /** Live chat button in the auth header */
    get liveChatButton(): Locator {
        return this.page.getByTestId("auth-btn-live-chat");
    }

    /** Inline validation / server error scoped inside the email input container */
    get validationError(): Locator {
        return this.page.getByTestId("login-input-identifier").locator("[role='alert']").first();
    }

    // ── Post-login home-app locators ──────────────────────────────────────────
    // After successful login, Ory Kratos redirects to staging-home.deriv.com/dashboard/home.
    // These locators assert the home-app dashboard rendered correctly.

    /**
     * "P2P" button in the "Explore Deriv" section — viewport-aware.
     * - Desktop: `dashboard-btn-explore-p2p-desktop`
     * - Mobile: `dashboard-btn-explore-p2p-mobile`
     */
    get p2pButton(): Locator {
        if (this.isMobile) {
            return this.page.getByTestId("dashboard-btn-explore-p2p-mobile");
        }
        return this.page.getByTestId("dashboard-btn-explore-p2p-desktop");
    }

    /** "My trading accounts" heading — used as the load-ready signal after login */
    get tradingAccountsHeading(): Locator {
        return this.page.getByRole("heading", { name: "My trading accounts" });
    }

    /** "Add more accounts" button — confirms trading accounts section fully rendered */
    get addMoreAccountsButton(): Locator {
        return this.page.getByTestId("dashboard-btn-add-more-accounts");
    }

    /**
     * "Home" navigation link — viewport-aware.
     * - Desktop: sidebar nav (`hidden lg:flex`)
     * - Mobile: bottom tab bar (`lg:hidden fixed bottom-0`)
     */
    get navHomeLink(): Locator {
        if (this.isMobile) {
            return this.page.locator('nav.lg\\:hidden a[href="/dashboard/home"]');
        }
        return this.page.locator('nav:not(.lg\\:hidden) a[href="/dashboard/home"]');
    }

    /**
     * "CFDs" / "Trade" navigation link — viewport-aware.
     * EU region labels this link "Trade"; ROW labels it "CFDs". Both point to /dashboard/cfds.
     * - Desktop: sidebar nav (`hidden lg:flex`)
     * - Mobile: bottom tab bar (`lg:hidden fixed bottom-0`)
     */
    get navCfdsLink(): Locator {
        if (this.isMobile) {
            return this.page.locator('nav.lg\\:hidden a[href="/dashboard/cfds"]');
        }
        return this.page.locator('nav:not(.lg\\:hidden) a[href="/dashboard/cfds"]');
    }

    /**
     * "Options" navigation link — viewport-aware.
     * - Desktop: sidebar nav (`hidden lg:flex`)
     * - Mobile: bottom tab bar (`lg:hidden fixed bottom-0`)
     */
    get navOptionsLink(): Locator {
        if (this.isMobile) {
            return this.page.locator('nav.lg\\:hidden a[href="/dashboard/options"]');
        }
        return this.page.locator('nav:not(.lg\\:hidden) a[href="/dashboard/options"]');
    }

    /**
     * "Portfolio" navigation link — viewport-aware.
     * - Desktop: sidebar nav (`hidden lg:flex`)
     * - Mobile: bottom tab bar (`lg:hidden fixed bottom-0`)
     */
    get navPortfolioLink(): Locator {
        if (this.isMobile) {
            return this.page.locator('nav.lg\\:hidden a[href="/dashboard/portfolio"]');
        }
        return this.page.locator('nav:not(.lg\\:hidden) a[href="/dashboard/portfolio"]');
    }

    /**
     * User profile link/button — viewport-aware.
     * - Desktop: sidebar link (`sidebar-link-profile`)
     * - Mobile: "Go to profile" button in the header
     */
    get userProfileLink(): Locator {
        if (this.isMobile) {
            return this.page.getByRole("button", { name: "Go to profile" });
        }
        return this.page.getByTestId("sidebar-link-profile");
    }

    // ============================================
    // ACTIONS
    // ============================================

    /**
     * Navigate to the external Deriv login page via LOGIN_URL env var.
     * Falls back to "/" if LOGIN_URL is not set.
     * After successful login, Ory Kratos redirects back to BASE_URL (/).
     */
    async gotoLoginPage(): Promise<void> {
        await this.page.goto(process.env.LOGIN_URL ?? "/");
        await this.waitForLoginPageToLoad();
    }

    /** Click the P2P button on the home-app dashboard to navigate to the P2P Markets page */
    async clickP2P(): Promise<void> {
        await expect(this.p2pButton, '"P2P" button should be visible on the dashboard').toBeVisible();
        await this.p2pButton.click();
    }

    /** Wait for the login page to be fully loaded and ready for interaction */
    async waitForLoginPageToLoad(): Promise<void> {
        await this.page.waitForLoadState("domcontentloaded");
        await this.welcomeBackHeading.waitFor({ state: "visible" });
    }

    /**
     * Enter an email address into the identifier field.
     * Dispatches a click on the label to mount the native input, then uses
     * pressSequentially so JS input events fire and the form recognises an email.
     *
     * @param email - Email address to enter
     */
    async enterEmail(email: string): Promise<void> {
        await expect(this.emailInputLabel, "Email input label should be visible").toBeVisible();
        await this.emailInputLabel.dispatchEvent("click");
        await expect(this.emailNativeInput, "Email native input should be visible before typing").toBeVisible();
        await this.emailNativeInput.pressSequentially(email, { delay: 75 });
    }

    /** Click the Log in / submit button */
    async clickLogInButton(): Promise<void> {
        await expect(this.logInButton, "Log in button should be enabled before clicking").toBeEnabled();
        await this.logInButton.click();
    }

    /**
     * Complete the full login flow and land on the P2P Markets home page.
     *
     * Flow: LOGIN_URL (staging-home.deriv.com/dashboard/login) → email → password →
     * staging-home.deriv.com/dashboard/home → click P2P → staging-p2p.deriv.com/
     *
     * @param email - User email (falls back to TEST_EMAIL env var)
     * @param password - User password (falls back to TEST_PASSWORD env var)
     * @returns The email address used to log in
     */
    async login(email?: string, password?: string): Promise<string> {
        const loginEmail = email ?? process.env.TEST_EMAIL;
        const loginPassword = password ?? process.env.TEST_PASSWORD;

        if (!loginEmail || !loginPassword) {
            throw new Error(
                "Login credentials not found. Provide email/password or set " +
                "TEST_EMAIL and TEST_PASSWORD in playwright/.env.staging"
            );
        }

        await this.gotoLoginPage();
        await this.enterEmail(loginEmail);
        await this.clickLogInButton();

        const passwordPage = new PasswordPage(this.page);
        await passwordPage.waitForPasswordPageToLoad();
        await passwordPage.enterPasswordAndSubmit(loginPassword);

        // Ory Kratos redirects to staging-home.deriv.com/dashboard/home after password.
        // Click the P2P button — this carries the SSO token and navigates to staging-dp2p.deriv.com/.
        // Use origin-match predicate because the landing URL includes query params (/?operation=buy&...).
        await this.page.waitForURL(/\/dashboard\/home/);
        await this.clickP2P();
        const base = (process.env.BASE_URL ?? "https://staging-dp2p.deriv.com").replace(/\/$/, "");
        await this.page.waitForURL((url) => url.origin === base);
        // Use "load" (not "domcontentloaded") so React effects — including the router.replace()
        // that strips SSO query params — have time to run before returning. Without this,
        // callers that immediately call page.goto("/") hit "Frame load interrupted" because
        // the router.replace redirect is still in flight.
        await this.page.waitForLoadState("load");

        return loginEmail;
    }

    // ============================================
    // VERIFICATIONS
    // ============================================

    /**
     * Assert that login completed successfully.
     *
     * Always asserts:
     * - URL is /dashboard/home
     * - "My trading accounts" heading is visible
     * - "Add more accounts" button is visible (confirms accounts section rendered)
     * - Home / CFDs / Options / Portfolio nav links are visible
     * - User profile link/button is visible
     */
    async verifySuccessfulLogin(): Promise<void> {
        await expect(this.page, "URL should be /dashboard/home after successful login").toHaveURL(/\/dashboard\/home/);
        await expect(this.tradingAccountsHeading, '"My trading accounts" heading should be visible').toBeVisible();
        await expect(this.addMoreAccountsButton, '"Add more accounts" button should be visible').toBeVisible();
        await expect(this.navHomeLink, '"Home" navigation link should be visible').toBeVisible();
        await expect(this.navCfdsLink, '"CFDs" / "Trade" navigation link should be visible').toBeVisible();
        await expect(this.navOptionsLink, '"Options" navigation link should be visible').toBeVisible();
        await expect(this.navPortfolioLink, '"Portfolio" navigation link should be visible').toBeVisible();
        await expect(this.userProfileLink, 'User profile link/button should be visible').toBeVisible();
    }

    /** Assert that all expected elements on the login page are visible */
    async verifyLoginPageElements(): Promise<void> {
        await expect(this.welcomeBackHeading, '"Welcome back!" heading should be visible').toBeVisible();
        await expect(this.emailInput, 'Email input should be visible').toBeVisible();
        await expect(this.logInButton, '"Log in" button should be visible').toBeVisible();
        await expect(this.googleButton, '"Log in with Google" button should be visible').toBeVisible();
        await expect(this.facebookButton, '"Log in with Facebook" button should be visible').toBeVisible();
        await expect(this.appleButton, '"Log in with Apple" button should be visible').toBeVisible();
        await expect(this.signUpLink, '"Sign up" link should be visible').toBeVisible();
        await expect(this.languageSwitcher, 'Language switcher button should be visible').toBeVisible();
        await expect(this.liveChatButton, 'Live chat button should be visible').toBeVisible();
    }
}
