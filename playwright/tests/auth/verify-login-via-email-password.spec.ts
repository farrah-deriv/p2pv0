/**
 * @name     Email + Password Login
 * @id       flow-1
 * @flow     playwright/flows/auth/flow.md#flow-1
 * @coverage playwright/flows/auth/coverage.md
 */
import { test } from '../../fixtures/fixtures';

test.describe('Login - Email and Password', { tag: ['@auth', '@smoke', '@desktop', '@mobile', '@staging'] }, () => {
    test.beforeAll(async () => {
        if (!process.env.TEST_EMAIL || !process.env.TEST_PASSWORD) {
            throw new Error(
                'Missing required env vars: TEST_EMAIL and TEST_PASSWORD must be set in playwright/.env.staging'
            );
        }
    });

    test('VERIFY email and password login redirects to home-app dashboard and P2P Markets via SSO', async ({
        loginPage,
        passwordPage,
        marketPage,
    }) => {
        // Step 1: Navigate to the login page
        await loginPage.gotoLoginPage();

        // Step 2: Verify all login page elements are visible
        await loginPage.verifyLoginPageElements();

        // Step 3: Enter email and submit
        await loginPage.enterEmail(process.env.TEST_EMAIL!);
        await loginPage.clickLogInButton();

        // Step 4: Verify all enter-password page elements are visible
        await passwordPage.verifyEnterPasswordPageElements();

        // Step 5: Enter password and submit
        await passwordPage.enterPassword(process.env.TEST_PASSWORD!);
        await passwordPage.submitPassword();

        // Step 6: Assert successful redirect to home-app dashboard
        await loginPage.verifySuccessfulLogin();

        // Step 7: Click P2P and assert automatic SSO into P2P Markets page
        await loginPage.clickP2P();
        await marketPage.verifyMarketPageLoaded();
    });
});
