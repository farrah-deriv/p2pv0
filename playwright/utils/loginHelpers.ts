import { Page } from "@playwright/test";
import { LoginPage } from "../pages/LoginPage";

/**
 * Standalone login helper for use outside of fixtures (e.g. in `beforeAll`).
 *
 * @example
 * ```typescript
 * import { loginHelpers } from '../utils';
 *
 * test.beforeAll(async ({ browser }) => {
 *   const page = await browser.newPage();
 *   await loginHelpers.login(page, process.env.TEST_EMAIL);
 * });
 * ```
 */
export const loginHelpers = {
    /**
     * Complete the full login flow using `LoginPage`.
     * Validates that `email` and `password` are present before attempting login.
     *
     * @param page - Playwright page object
     * @param email - User email (falls back to `TEST_EMAIL` env var)
     * @param password - User password (falls back to `TEST_PASSWORD` env var)
     * @returns The email address used to log in
     */
    login: async (page: Page, email?: string, password?: string): Promise<string> => {
        const loginPage = new LoginPage(page);
        return loginPage.login(email, password);
    },
};
