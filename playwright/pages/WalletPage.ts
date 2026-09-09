import { Page, Locator, expect } from "@playwright/test";

/**
 * WalletPage - Handles all interactions on the P2P Wallet page (`/wallet`).
 *
 * @example
 * ```typescript
 * const walletPage = new WalletPage(page);
 * await walletPage.gotoWalletPage();
 * await walletPage.verifyWalletPageLoaded();
 * ```
 */
export class WalletPage {
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

    /** P2P balance display */
    get p2pBalance(): Locator {
        return this.page.getByTestId("wallet-p2p-balance");
    }

    /** Transfer button */
    get transferButton(): Locator {
        return this.page.getByTestId("wallet-btn-transfer");
    }

    /** Deposit button */
    get depositButton(): Locator {
        return this.page.getByTestId("wallet-btn-deposit");
    }

    /** Withdraw button */
    get withdrawButton(): Locator {
        return this.page.getByTestId("wallet-btn-withdraw");
    }

    /** Transaction history list */
    get transactionList(): Locator {
        return this.page.getByTestId("wallet-transaction-list");
    }

    // ============================================
    // ACTIONS
    // ============================================

    /**
     * Navigate directly to the wallet page.
     * Supports optional deep-link operation param (`?operation=TRANSFER`).
     *
     * @param operation - Optional deep-link operation (e.g. 'TRANSFER')
     */
    async gotoWalletPage(operation?: string): Promise<void> {
        const url = operation ? `/wallet?operation=${operation}` : "/wallet";
        await this.page.goto(url);
        await this.page.waitForLoadState("domcontentloaded");
    }

    /**
     * Click the Transfer button.
     */
    async clickTransfer(): Promise<void> {
        await expect(this.transferButton, "Transfer button should be visible").toBeVisible();
        await this.transferButton.click();
    }

    // ============================================
    // VERIFICATIONS
    // ============================================

    /**
     * Assert the wallet page has loaded with the P2P balance visible.
     */
    async verifyWalletPageLoaded(): Promise<void> {
        await expect(this.p2pBalance, "P2P balance should be visible on wallet page").toBeVisible();
    }
}
