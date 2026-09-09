import { Page, Locator, expect } from "@playwright/test";

/**
 * AdsPage - Handles all interactions on the My Ads page (`/ads`).
 *
 * @example
 * ```typescript
 * const adsPage = new AdsPage(page);
 * await adsPage.gotoAdsPage();
 * await adsPage.verifyAdsPageLoaded();
 * ```
 */
export class AdsPage {
    readonly page: Page;

    constructor(page: Page) {
        this.page = page;
    }

    // ============================================
    // LOCATORS
    // ============================================

    /**
     * "Create ad" button — covers two states and the dual desktop/mobile layout:
     * - When ads exist: top-bar button (`data-testid="ads-btn-create"`)
     * - When no ads (empty state): button inside `data-testid="ads-empty-state"`
     * `.filter({ visible: true })` picks the active layout's copy (desktop vs mobile).
     */
    get createAdButton(): Locator {
        return this.page
            .getByTestId("ads-btn-create")
            .or(this.page.getByTestId("ads-empty-state").getByRole("button", { name: "Create ad" }))
            .filter({ visible: true });
    }

    /** List of my ad cards (dynamic testid pattern `ads-row-{id}`) */
    get adCards(): Locator {
        return this.page.locator("[data-testid^='ads-row-']");
    }

    /** Empty state when no ads exist */
    get emptyState(): Locator {
        return this.page.getByTestId("ads-empty-state");
    }

    /** Buy ads tab */
    get buyAdsTab(): Locator {
        return this.page.getByTestId("ads-tab-buy");
    }

    /** Sell ads tab */
    get sellAdsTab(): Locator {
        return this.page.getByTestId("ads-tab-sell");
    }

    /**
     * "Hide my ads" toggle switch.
     * The page renders both desktop and mobile layouts simultaneously — filter to the
     * visible one to avoid a strict mode violation when two elements match the testid.
     */
    get hideMyAdsSwitch(): Locator {
        return this.page.getByTestId("ads-switch-hide-ads").filter({ visible: true });
    }

    /**
     * "Pause my ads" label text (translation key myAds.hideMyAds — renamed from "Hide my ads").
     * Both desktop and mobile layouts render this label; filter to the visible copy.
     */
    get hideMyAdsLabel(): Locator {
        return this.page.getByText("Pause my ads", { exact: true }).filter({ visible: true });
    }

    /**
     * Ads table container.
     * Dual layout renders two copies; `.first()` ensures we target only one element.
     * Code that previously called `adsTableContainer.first()` should drop the `.first()`.
     */
    get adsTableContainer(): Locator {
        return this.page.getByTestId("ads-table-container").first();
    }

    /** First ad row in the table (dynamic testid pattern `ads-row-{id}`) */
    get firstAdRow(): Locator {
        return this.page.locator("[data-testid^='ads-row-']").first();
    }

    /** Status badge on the first ad row (dynamic testid pattern `ads-badge-status-{id}`) */
    get firstAdStatusBadge(): Locator {
        return this.page.locator("[data-testid^='ads-badge-status-']").first();
    }

    // ============================================
    // ACTIONS
    // ============================================

    /**
     * Navigate directly to the My Ads page.
     *
     * Waits for the /onboarding-status response in addition to DOM content — the app's
     * main.tsx useEffect sets verificationStatus only after this response arrives.
     * Without it, handleCreateAd sees verificationStatus=undefined (falsy phone_verified)
     * and shows the KYC popup instead of navigating to /ads/create.
     */
    async gotoAdsPage(): Promise<void> {
        // Register the listener BEFORE navigating so it catches the request triggered
        // by the new page load (not a stale response from a previous navigation).
        const onboardingStatusDone = this.page.waitForResponse(
            (resp) =>
                resp.url().includes("/onboarding-status") && resp.request().method() === "GET",
            { timeout: 30000 }
        );
        await this.page.goto("/ads");
        await this.page.waitForLoadState("domcontentloaded");
        await onboardingStatusDone;
    }

    /**
     * Delete all existing ads for the logged-in user via the P2P REST API.
     *
     * Intercepts the adverts GET request the app makes on page load to discover the
     * real P2P backend URL (which differs from the Next.js frontend URL). Session
     * cookies are shared between the browser and page.request, so no extra auth is needed.
     *
     * Requires the browser to already be authenticated (call loginPage.login() first).
     *
     * @returns The discovered P2P API base URL (e.g. "https://api.example.com/p2p/v1"),
     *          or null if the URL could not be intercepted.
     */
    async deleteAllAds(): Promise<string | null> {
        // Register the listener BEFORE navigating so we never miss the response.
        const advertsResponsePromise = this.page.waitForResponse(
            (resp) =>
                resp.url().includes("/p2p/v1/adverts") && resp.request().method() === "GET",
            { timeout: 20000 }
        );

        await this.page.goto("/ads");

        let apiBase: string;
        let ads: Array<{ id: number | string }> = [];

        try {
            const advertsResponse = await advertsResponsePromise;
            const responseUrl = new URL(advertsResponse.url());
            apiBase = `${responseUrl.origin}/p2p/v1`;

            const listData = await advertsResponse.json() as { data?: Array<{ id: number | string }> };
            ads = listData?.data ?? [];
        } catch {
            // Could not intercept the adverts call — skip cleanup and let the test proceed.
            return null;
        }

        for (const ad of ads) {
            await this.page.request.delete(`${apiBase}/adverts/${ad.id}`);
        }

        return apiBase;
    }

    /**
     * Delete only ads whose exchange_rate matches the given rate string.
     *
     * Use this instead of deleteAllAds() when multiple Playwright projects share
     * the same test account and run in parallel — deleting only the project-specific
     * rate prevents one project's beforeEach from removing another project's in-flight ad.
     *
     * @param rate - The fixed rate to match, e.g. "1.50"
     * @returns The discovered P2P API base URL (same shape as deleteAllAds), or null on failure.
     */
    async deleteAdsByRate(rate: string): Promise<string | null> {
        // Filter specifically for the My Ads endpoint. The marketplace also calls
        // /p2p/v1/adverts but WITHOUT the show_inactive param — this filter avoids
        // catching the marketplace response (which would contain other users' ads).
        const advertsResponsePromise = this.page.waitForResponse(
            (resp) =>
                resp.url().includes("/p2p/v1/adverts") &&
                resp.url().includes("show_inactive") &&
                resp.request().method() === "GET",
            { timeout: 20000 }
        );

        await this.page.goto("/ads");

        try {
            const advertsResponse = await advertsResponsePromise;
            const responseUrl = new URL(advertsResponse.url());
            const apiBase = `${responseUrl.origin}/p2p/v1`;

            const listData = await advertsResponse.json() as {
                data?: Array<{ id: number | string; exchange_rate: number }>;
            };
            const ads = listData?.data ?? [];
            const targetRate = parseFloat(rate);

            for (const ad of ads) {
                if (Math.abs(ad.exchange_rate - targetRate) < 0.001) {
                    await this.page.request.delete(`${apiBase}/adverts/${ad.id}`);
                }
            }

            return apiBase;
        } catch {
            // Could not intercept the adverts call — skip cleanup and let the test proceed.
            return null;
        }
    }

    /**
     * Ensure the logged-in user has at least one saved payment method suitable for
     * a Sell ad. Sell ads require the seller to have user-owned payment methods
     * (saved under /user-payment-methods) — unlike Buy ads which use global types.
     *
     * If the account already has payment methods, this is a no-op.
     * If none exist, the first available payment method type is fetched and a minimal
     * entry is created via the API using placeholder field values.
     *
     * @param apiBase - The P2P API base URL returned by deleteAllAds().
     */
    async ensureSellPaymentMethodExists(apiBase: string): Promise<void> {
        const userPmResp = await this.page.request.get(`${apiBase}/user-payment-methods`);
        if (!userPmResp.ok()) return;

        const userPmData = await userPmResp.json() as { data?: Array<{ id: string }> };
        if ((userPmData?.data ?? []).length > 0) return; // account already has payment methods

        const availableResp = await this.page.request.get(`${apiBase}/available-payment-methods`);
        if (!availableResp.ok()) return;

        const availableData = await availableResp.json() as {
            data?: Array<{
                method: string;
                // The API returns fields as an object keyed by field name, not an array.
                fields?: Record<string, { required?: number | boolean }>;
            }>;
        };
        const methods = availableData?.data ?? [];
        if (methods.length === 0) return;

        const paymentMethod = methods[0];
        const fields: Record<string, string> = { instructions: "-" };
        for (const [name, def] of Object.entries(paymentMethod.fields ?? {})) {
            if (def.required) {
                fields[name] = "1234567890";
            }
        }

        const createResp = await this.page.request.post(`${apiBase}/user-payment-methods`, {
            data: { data: { method: paymentMethod.method, fields } },
        });
        const createBody = await createResp.text();
        if (!createResp.ok()) {
            throw new Error(
                `ensureSellPaymentMethodExists: POST /user-payment-methods failed ` +
                `(${createResp.status()}): ${createBody}`
            );
        }
    }

    /**
     * After the success screen's "Go to My Ads" button navigates back to /ads,
     * assert that a row containing the given rate text is visible in the ads table.
     *
     * Sell ads can be inactive in the marketplace if the account has insufficient
     * P2P crypto balance, so verifying via My Ads is more reliable for sell ad
     * creation tests than verifying via the marketplace Buy tab.
     *
     * @param rate - The rate string as entered in the wizard, e.g. "1.50"
     */
    async verifyAdOnMyAds(rate: string): Promise<void> {
        await this.page.waitForURL(/\/ads/);
        await expect(this.createAdButton, "My Ads page should be loaded").toBeVisible();
        // Wait for a row with this rate to appear in the DOM. state:'attached' avoids
        // any visibility/layout check — it just waits until React renders the row.
        // This handles the empty-state flash that appears before the ads API responds.
        const adRow = this.page.locator("[data-testid^='ads-row-']").filter({ hasText: rate }).first();
        await adRow.waitFor({ state: "attached", timeout: 45000 });

        // Use textContent (not innerText) to confirm the rate text is present.
        // <tr> elements with display:grid (mobile responsive table) cause Playwright to
        // report zero bounding boxes for the row AND all its children, making both
        // toBeVisible() and getBoundingClientRect() fail even though the ad is correctly
        // rendered on screen (confirmed via screenshot). textContent reads raw DOM text
        // and is unaffected by any CSS layout or visibility quirks.
        // .first() because the page renders both desktop and mobile layouts simultaneously,
        // producing two ads-table-container elements; both hold the same ad data.
        const tableText = await this.adsTableContainer.evaluate((el) => el.textContent ?? "");
        expect(tableText, `Ad with rate "${rate}" should appear in My Ads table`).toContain(rate);
    }

    /**
     * Click the Create Ad button and wait for navigation to /ads/create.
     *
     * handleCreateAd() only router.push("/ads/create") when verificationStatus.phone_verified
     * is set (populated from /onboarding-status). On fresh sessions under parallel load there
     * is a race: the Create Ad button can be clicked before verificationStatus resolves, which
     * instead opens the KYC onboarding AlertDialog (data-testid="kyc-sheet-container"). When
     * that happens the URL never changes, so waitForURL would time out. Detect the popup,
     * dismiss it (kyc-btn-close), and retry the click — up to a few attempts.
     */
    async clickCreateAd(): Promise<void> {
        await expect(this.createAdButton, "Create ad button should be visible").toBeVisible();

        const kycSheet = this.page.getByTestId("kyc-sheet-container");
        const kycCloseBtn = this.page.getByTestId("kyc-btn-close");

        for (let attempt = 1; attempt <= 3; attempt++) {
            await this.createAdButton.click();

            // Race between navigation and the KYC popup appearing. Resolve whichever
            // happens first: success (URL changes to /ads/create) or the KYC popup opens.
            const openedKyc = await Promise.race([
                this.page.waitForURL(/\/ads\/create/, { timeout: 15000 }).then(() => false),
                kycSheet.waitFor({ state: "visible", timeout: 15000 }).then(() => true),
            ]).catch(() => false);

            if (!openedKyc) {
                // Navigation happened (or neither did — assume success on URL change).
                await this.page.waitForURL(/\/ads\/create/, { timeout: 15000 }).catch(() => {});
                return;
            }

            // KYC popup opened instead of navigating — dismiss it and retry.
            if (await kycCloseBtn.isVisible().catch(() => false)) {
                await kycCloseBtn.click().catch(() => {});
                await kycSheet.waitFor({ state: "hidden", timeout: 5000 }).catch(() => {});
            } else {
                await this.page.keyboard.press("Escape").catch(() => {});
                await kycSheet.waitFor({ state: "hidden", timeout: 5000 }).catch(() => {});
            }
        }

        // Final attempt: one more click, then hard-wait for navigation (surfaces a clear
        // timeout if the account genuinely isn't verified — distinct from a silent flake).
        await this.createAdButton.click();
        await this.page.waitForURL(/\/ads\/create/);
    }

    /**
     * Dismiss the "Welcome to Deriv P2P" onboarding modal if it is present.
     * The modal blocks the Create Ad button and appears on fresh accounts or after
     * account state resets on staging. "Skip for now" closes it without taking a tour.
     */
    private async dismissWelcomeModalIfVisible(): Promise<void> {
        const skipBtn = this.page.getByRole("button", { name: /skip for now/i });
        try {
            await skipBtn.waitFor({ state: "visible", timeout: 4000 });
            await skipBtn.click();
            await skipBtn.waitFor({ state: "hidden", timeout: 5000 });
        } catch {
            // Modal not present — nothing to do
        }
    }

    // ============================================
    // VERIFICATIONS
    // ============================================

    /**
     * Assert the My Ads page has loaded.
     */
    async verifyAdsPageLoaded(): Promise<void> {
        await this.dismissWelcomeModalIfVisible();
        await expect(this.createAdButton, "Create ad button should be visible on My Ads page").toBeVisible();
    }
}
