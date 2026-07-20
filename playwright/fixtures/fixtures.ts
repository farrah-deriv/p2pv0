import { test as base, Page } from "@playwright/test";
import { LoginPage } from "../pages/LoginPage";
import { PasswordPage } from "../pages/PasswordPage";
import { MarketPage } from "../pages/MarketPage";
import { AdsPage } from "../pages/AdsPage";
import { AdsCreatePage } from "../pages/AdsCreatePage";
import { AdvertiserPage } from "../pages/AdvertiserPage";
import { OrdersPage } from "../pages/OrdersPage";
import { OrderDetailPage } from "../pages/OrderDetailPage";
import { ProfilePage } from "../pages/ProfilePage";
import { WalletPage } from "../pages/WalletPage";

/**
 * Extended test fixtures with page object models for p2p-v0.
 *
 * Import `test` from this file in all spec files — NOT from `@playwright/test` directly.
 *
 * @example
 * ```typescript
 * import { test, expect } from "../fixtures/fixtures";
 *
 * test("my test", async ({ loginPage }) => {
 *   await loginPage.login();
 * });
 * ```
 *
 * To add a new fixture:
 *   1. Create the page object in `playwright/pages/`
 *   2. Import it here
 *   3. Add the type to the `base.extend<{...}>()` generic
 *   4. Add the fixture implementation below
 */

/**
 * Suppress WebAuthn / Passkeys browser popup.
 *
 * Ory Kratos calls `navigator.credentials.get({ mediation: "conditional" })` on
 * every page load. Stubbing it at the init-script level prevents the OS-level
 * credential UI from appearing during tests.
 */
async function suppressWebAuthn(page: Page): Promise<void> {
    await page.addInitScript(() => {
        Object.defineProperty(navigator, "credentials", {
            value: {
                get: () => Promise.resolve(null),
                create: () => Promise.resolve(null),
                store: () => Promise.resolve(null),
                preventSilentAccess: () => Promise.resolve(undefined),
            },
            writable: false,
            configurable: true,
        });
    });
}

export const test = base.extend<{
    loginPage: LoginPage;
    passwordPage: PasswordPage;
    marketPage: MarketPage;
    adsPage: AdsPage;
    adsCreatePage: AdsCreatePage;
    advertiserPage: AdvertiserPage;
    ordersPage: OrdersPage;
    orderDetailPage: OrderDetailPage;
    profilePage: ProfilePage;
    walletPage: WalletPage;
    /** True when running under a mobile project (viewport width < 1024px). */
    isMobileViewport: boolean;
}>({
    /**
     * Override the built-in `page` fixture to register the WebAuthn suppression
     * init script before any test code runs.
     */
    page: async ({ page }, use) => {
        await suppressWebAuthn(page);
        await use(page);
    },

    /**
     * Login page fixture — provides initialized LoginPage instance.
     */
    loginPage: async ({ page }, use) => {
        const loginPage = new LoginPage(page);
        await use(loginPage);
    },

    /**
     * Password page fixture — provides initialized PasswordPage instance.
     * Covers the /enter-password step of the Ory Kratos login flow.
     */
    passwordPage: async ({ page }, use) => {
        const passwordPage = new PasswordPage(page);
        await use(passwordPage);
    },

    /**
     * Market page fixture — provides initialized MarketPage instance.
     * Covers the P2P Markets home (root `/`).
     */
    marketPage: async ({ page }, use) => {
        const marketPage = new MarketPage(page);
        await use(marketPage);
    },

    /**
     * Ads page fixture — provides initialized AdsPage instance.
     * Covers the My Ads section (`/ads`).
     */
    adsPage: async ({ page }, use) => {
        const adsPage = new AdsPage(page);
        await use(adsPage);
    },

    /**
     * Ads create page fixture — provides initialized AdsCreatePage instance.
     * Covers the Create/Edit Ad wizard (`/ads/create`, `/ads/edit/[id]`).
     */
    adsCreatePage: async ({ page }, use) => {
        const adsCreatePage = new AdsCreatePage(page);
        await use(adsCreatePage);
    },

    /**
     * Advertiser page fixture — provides initialized AdvertiserPage instance.
     * Covers the advertiser profile page (`/advertiser/[id]`).
     */
    advertiserPage: async ({ page }, use) => {
        const advertiserPage = new AdvertiserPage(page);
        await use(advertiserPage);
    },

    /**
     * Orders page fixture — provides initialized OrdersPage instance.
     * Covers the Orders list (`/orders`).
     */
    ordersPage: async ({ page }, use) => {
        const ordersPage = new OrdersPage(page);
        await use(ordersPage);
    },

    /**
     * Order detail page fixture — provides initialized OrderDetailPage instance.
     * Covers a single order (`/orders/[id]`).
     */
    orderDetailPage: async ({ page }, use) => {
        const orderDetailPage = new OrderDetailPage(page);
        await use(orderDetailPage);
    },

    /**
     * Profile page fixture — provides initialized ProfilePage instance.
     * Covers the user profile page (`/profile`).
     */
    profilePage: async ({ page }, use) => {
        const profilePage = new ProfilePage(page);
        await use(profilePage);
    },

    /**
     * Wallet page fixture — provides initialized WalletPage instance.
     * Covers the P2P wallet page (`/wallet`).
     */
    walletPage: async ({ page }, use) => {
        const walletPage = new WalletPage(page);
        await use(walletPage);
    },

    /**
     * isMobileViewport fixture — true when the current project uses a mobile viewport
     * (width < 1024px, i.e. below the Tailwind `lg` breakpoint).
     *
     * Captured once at fixture initialisation time — does NOT reflect dynamic
     * `page.setViewportSize()` calls made during the test.
     */
    isMobileViewport: async ({ page }, use) => {
        const width = page.viewportSize()?.width ?? 1024;
        await use(width < 1024);
    },
});

// Re-export expect for convenience
export { expect } from "@playwright/test";
