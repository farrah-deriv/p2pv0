/**
 * @name     Unauthenticated user is redirected to login
 * @id       flow-2
 * @flow     playwright/flows/auth/flow.md#flow-2--verify-unauthenticated-redirectspects
 * @coverage playwright/flows/auth/coverage.md
 *
 * Does NOT hardcode the redirect target — the destination varies by user type
 * (new-format users go to staging-home.deriv.com, v1 users go to staging-app.deriv.com).
 */
import { test, expect } from "../../fixtures/fixtures";

/**
 * Flow 2 — Unauthenticated user is redirected away from /
 */
test.describe("Auth — Unauthenticated redirect", { tag: ["@desktop", "@mobile", "@auth", "@staging"] }, () => {
    test("VERIFY unauthenticated navigation to / redirects the user away from the P2P Markets page", async ({
        page,
    }) => {
        await page.goto("/");

        // Wait for redirect away from / — destination varies by user type (may be external or /login)
        await page.waitForURL(
            (url) => url.pathname !== "/" || url.hostname !== new URL(page.url()).hostname,
            { timeout: 15000 }
        );

        expect(page.url(),
            "Unauthenticated user should be redirected away from the P2P Markets home page").not.toMatch(/^https?:\/\/[^/]+\/$/);
    });
});
