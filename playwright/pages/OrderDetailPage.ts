import { Page, Locator, expect } from "@playwright/test";

/**
 * OrderDetailPage - Handles all interactions on a single order detail page (`/orders/[id]`).
 *
 * @example
 * ```typescript
 * const orderDetailPage = new OrderDetailPage(page);
 * await orderDetailPage.gotoOrderDetailPage("ORD-123");
 * await orderDetailPage.verifyOrderDetailLoaded();
 * ```
 */
export class OrderDetailPage {
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

    /** Order ID display */
    get orderId(): Locator {
        return this.page.getByTestId("order-detail-id");
    }

    /** Order status badge */
    get orderStatus(): Locator {
        return this.page.getByTestId("order-detail-status");
    }

    /** Order amount */
    get orderAmount(): Locator {
        return this.page.getByTestId("order-detail-amount");
    }

    /** "I've paid" / confirm payment button */
    get confirmPaymentButton(): Locator {
        return this.page.getByTestId("order-btn-confirm-payment");
    }

    /** "Release funds" button (seller side) */
    get releaseFundsButton(): Locator {
        return this.page.getByTestId("order-btn-release-funds");
    }

    /** Dispute / raise complaint button */
    get disputeButton(): Locator {
        return this.page.getByTestId("order-btn-dispute");
    }

    /** Chat message input */
    get chatInput(): Locator {
        return this.page.getByTestId("order-chat-input");
    }

    /** Chat send button */
    get chatSendButton(): Locator {
        return this.page.getByTestId("order-chat-btn-send");
    }

    // ============================================
    // ACTIONS
    // ============================================

    /**
     * Navigate directly to an order's detail page.
     *
     * @param orderId - The order ID
     */
    async gotoOrderDetailPage(orderId: string): Promise<void> {
        await this.page.goto(`/orders/${orderId}`);
        await this.page.waitForLoadState("domcontentloaded");
    }

    /**
     * Send a chat message on the order detail page.
     *
     * @param message - Message text to send
     */
    async sendChatMessage(message: string): Promise<void> {
        await expect(this.chatInput, "Chat input should be visible").toBeVisible();
        await this.chatInput.fill(message);
        await this.chatSendButton.click();
    }

    // ============================================
    // VERIFICATIONS
    // ============================================

    /**
     * Assert the order detail page has loaded with the order ID visible.
     */
    async verifyOrderDetailLoaded(): Promise<void> {
        await expect(this.orderId, "Order ID should be visible on detail page").toBeVisible();
        await expect(this.orderStatus, "Order status should be visible on detail page").toBeVisible();
    }
}
