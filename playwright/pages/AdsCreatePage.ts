import { Page, Locator, expect } from "@playwright/test";

/**
 * AdsCreatePage - Handles all interactions on the Create/Edit Ad wizard (`/ads/create`, `/ads/edit/[id]`).
 *
 * @example
 * ```typescript
 * const adsCreatePage = new AdsCreatePage(page);
 * await adsCreatePage.verifyStep0Visible();
 * await adsCreatePage.fillAdStep0("1000", "10", "500");
 * await adsCreatePage.proceedToStep1();
 * ```
 */
export class AdsCreatePage {
    readonly page: Page;

    constructor(page: Page) {
        this.page = page;
    }

    // ============================================
    // LOCATORS
    // ============================================

    /**
     * The app renders both desktop and mobile layouts simultaneously; only one is visible.
     * Use .filter({ visible: true }) on every locator to target the active layout's copy.
     */

    /**
     * Step 0 label in circle progress: "Set ad and rate type".
     */
    get stepSetAdAndRateTypeTitle(): Locator {
        return this.page
            .getByTestId("ad-form-progress")
            .filter({ visible: true })
            .getByText("Set ad and rate type", { exact: true });
    }

    /** Step 1 label in circle progress: "Set amount and payment" */
    get stepSetPaymentDetailsTitle(): Locator {
        return this.page
            .getByTestId("ad-form-progress")
            .filter({ visible: true })
            .getByText("Set amount and payment", { exact: true });
    }

    /** Step 2 label in circle progress: "Set ad conditions" */
    get stepSetAdConditionsTitle(): Locator {
        return this.page
            .getByTestId("ad-form-progress")
            .filter({ visible: true })
            .getByText("Set ad conditions", { exact: true });
    }

    /** Review step summary (full page after conditions) */
    get reviewSummary(): Locator {
        return this.page.getByTestId("ad-form-review-summary").filter({ visible: true });
    }

    /**
     * "I want to Buy" tab in the trade-type selector (step 0, create mode only).
     * Selected by default when the wizard opens.
     */
    get tradeTypeBuyTab(): Locator {
        return this.page.getByTestId("ad-form-radio-type-buy").filter({ visible: true });
    }

    /**
     * "I want to Sell" tab in the trade-type selector (step 0, create mode only).
     */
    get tradeTypeSellTab(): Locator {
        return this.page.getByTestId("ad-form-radio-type-sell").filter({ visible: true });
    }

    /** Rate input (step 0) — fixed rate value per local currency */
    get rateInput(): Locator {
        return this.page.getByTestId("ad-form-input-rate").filter({ visible: true });
    }

    /** Total amount input (step 0) */
    get totalAmountInput(): Locator {
        return this.page.getByTestId("ad-form-input-total-amount").filter({ visible: true });
    }

    /** Minimum order input (step 0) */
    get minOrderInput(): Locator {
        return this.page.getByTestId("ad-form-input-min-amount").filter({ visible: true });
    }

    /** Maximum order input (step 0) */
    get maxOrderInput(): Locator {
        return this.page.getByTestId("ad-form-input-max-amount").filter({ visible: true });
    }

    /** Next button advancing from step 0 to step 1 */
    get nextToStep1Button(): Locator {
        return this.page.getByTestId("ad-form-btn-next-step1").filter({ visible: true });
    }

    /** Next button advancing from step 1 to step 2 */
    get nextToStep2Button(): Locator {
        return this.page.getByTestId("ad-form-btn-next-step2").filter({ visible: true });
    }

    /** Next button advancing from step 2 (conditions) to review */
    get nextToReviewButton(): Locator {
        return this.page.getByTestId("ad-form-btn-next-step3").filter({ visible: true });
    }

    /**
     * Submit button on review step.
     * Reads "Create ad" in create mode and "Save changes" in edit mode.
     */
    get submitButton(): Locator {
        return this.page.getByTestId("ad-form-btn-submit").filter({ visible: true });
    }

    /** "Select payment method" dropdown button that opens the payment selection sheet (step 1) */
    get selectPaymentMethodButton(): Locator {
        return this.page.getByRole("button", { name: /select payment method/i }).filter({ visible: true });
    }

    /** Payment method selection sheet/dialog (opens after clicking selectPaymentMethodButton) */
    get paymentMethodSheet(): Locator {
        return this.page.getByTestId("ad-form-sheet-payment-methods");
    }

    /** First visible checkbox inside the payment method sheet */
    get firstPaymentMethodCheckbox(): Locator {
        return this.paymentMethodSheet.getByRole("checkbox").first();
    }

    /** "Confirm" button inside the payment method sheet */
    get paymentSheetConfirmButton(): Locator {
        return this.paymentMethodSheet.getByRole("button", { name: /confirm/i });
    }

    /** Success screen heading: "Ad created" */
    get successHeading(): Locator {
        return this.page.getByRole("heading", { name: "Ad created" });
    }

    /** "Go to My ads" button on the success screen */
    get goToMyAdsButton(): Locator {
        return this.page.getByTestId("ad-form-btn-done");
    }

    // ============================================
    // ACTIONS
    // ============================================

    /**
     * Switch the trade-type selector to "I want to Buy" (step 0, create mode only).
     * Buy is the default; call this only if you need to explicitly assert or reset to Buy.
     */
    async selectBuyAdType(): Promise<void> {
        await expect(this.tradeTypeBuyTab, "Buy type tab should be visible on step 0").toBeVisible();
        await this.tradeTypeBuyTab.click();
    }

    /**
     * Switch the trade-type selector to "I want to Sell" (step 0, create mode only).
     */
    async selectSellAdType(): Promise<void> {
        await expect(this.tradeTypeSellTab, "Sell type tab should be visible on step 0").toBeVisible();
        await this.tradeTypeSellTab.click();
    }

    /**
     * Fill the rate field on step 0 (amounts moved to step 1).
     *
     * @param rate - Fixed rate per local currency (e.g. "1.5")
     */
    async fillAdStep0Rate(rate: string): Promise<void> {
        await expect(this.rateInput, "Rate input should be visible on step 0").toBeVisible();
        await this.rateInput.fill(rate);
    }

    /**
     * Fill amount fields on step 1 (Set amount and payment).
     *
     * @param totalAmount - Total buy/sell amount (e.g. "1000")
     * @param minOrder    - Minimum order amount (e.g. "10")
     * @param maxOrder    - Maximum order amount (e.g. "500")
     */
    async fillAdStep1Amounts(totalAmount: string, minOrder: string, maxOrder: string): Promise<void> {
        await expect(this.totalAmountInput, "Total amount input should be visible on step 1").toBeVisible();
        await this.totalAmountInput.fill(totalAmount);
        await expect(this.minOrderInput, "Minimum order input should be visible on step 1").toBeVisible();
        await this.minOrderInput.fill(minOrder);
        await expect(this.maxOrderInput, "Maximum order input should be visible on step 1").toBeVisible();
        await this.maxOrderInput.fill(maxOrder);
    }

    /**
     * @deprecated Prefer fillAdStep0Rate + fillAdStep1Amounts. Kept for call-site compatibility:
     * fills rate on step 0 only; amounts must be filled after proceedToStep1 via fillAdStep1Amounts.
     */
    async fillAdStep0(rate: string, _totalAmount?: string, _minOrder?: string, _maxOrder?: string): Promise<void> {
        await this.fillAdStep0Rate(rate);
    }

    /**
     * Click the Next button to advance from step 0 to step 1.
     */
    async proceedToStep1(): Promise<void> {
        await expect(this.nextToStep1Button, "Next button (step 0 → 1) should be visible").toBeVisible();
        await this.nextToStep1Button.click();
    }

    /**
     * Open the payment method selection sheet and check the first available method (step 1).
     * For a Buy ad the sheet shows available payment methods; clicking Confirm closes it.
     */
    async selectFirstPaymentMethod(): Promise<void> {
        await expect(this.selectPaymentMethodButton, "Select payment method button should be visible on step 1").toBeVisible();
        await this.selectPaymentMethodButton.click();
        await expect(this.paymentMethodSheet, "Payment method sheet should open").toBeVisible();
        await expect(this.firstPaymentMethodCheckbox, "First payment method checkbox should be visible in the sheet").toBeVisible();
        await this.firstPaymentMethodCheckbox.check();
        await expect(this.paymentSheetConfirmButton, "Confirm button should be visible in the sheet").toBeVisible();
        await this.paymentSheetConfirmButton.click();
        await expect(this.paymentMethodSheet, "Payment method sheet should close after confirming").not.toBeVisible();
    }

    /**
     * Open the payment method selection dialog and check the first available method (step 1, Sell ad).
     *
     * Sell ads use `showAlert()` to open payment selection — an AlertDialog on desktop and a Drawer
     * on mobile — neither of which has a dedicated `data-testid` on the outer container.
     * Checkboxes inside still carry `data-testid="ad-form-checkbox-payment-{id}"`, so we target
     * those directly rather than scoping to the container.
     *
     */
    async selectFirstPaymentMethodSellAd(): Promise<void> {
        await expect(this.selectPaymentMethodButton, "Select payment method button should be visible on step 1").toBeVisible();
        await this.selectPaymentMethodButton.click();

        const firstCheckbox = this.page.locator("[data-testid^='ad-form-checkbox-payment-']").first();
        await expect(firstCheckbox, "First payment method checkbox should be visible in the payment dialog").toBeVisible();
        // The Checkbox has pointer-events-none; click its immediate parent div which
        // bubbles up to the row's onClick handler (no stopPropagation in between).
        await firstCheckbox.locator("..").click();

        const confirmButton = this.page.getByRole("button", { name: /confirm/i }).filter({ visible: true });
        await expect(confirmButton, "Confirm button should be visible in the payment dialog").toBeVisible();
        await confirmButton.click();

        await expect(firstCheckbox, "Payment selection dialog should close after confirming").not.toBeVisible();
    }

    /**
     * Click the Next button to advance from step 1 to step 2.
     */
    async proceedToStep2(): Promise<void> {
        await expect(this.nextToStep2Button, "Next button (step 1 → 2) should be visible").toBeVisible();
        await this.nextToStep2Button.click();
    }

    /**
     * Click Next on step 2 to open the review screen.
     */
    async proceedToReview(): Promise<void> {
        await expect(this.nextToReviewButton, "Next button (step 2 → review) should be visible").toBeVisible();
        await this.nextToReviewButton.click();
        await expect(this.reviewSummary, "Review summary should be visible").toBeVisible();
    }

    /**
     * Click the Submit button on the review step to create or save the ad.
     */
    async submitCreateAd(): Promise<void> {
        await expect(this.submitButton, "Submit button should be visible on review step").toBeVisible();
        await this.submitButton.click();
    }

    // ============================================
    // VERIFICATIONS
    // ============================================

    /**
     * Assert that step 0 of the create/edit wizard is visible.
     */
    async verifyStep0Visible(): Promise<void> {
        await expect(
            this.stepSetAdAndRateTypeTitle,
            "Step 0 title 'Set ad and rate type' should be visible"
        ).toBeVisible();
    }

    /**
     * Assert that step 1 of the create/edit wizard is visible.
     */
    async verifyStep1Visible(): Promise<void> {
        await expect(
            this.stepSetPaymentDetailsTitle,
            "Step 1 title 'Set amount and payment' should be visible"
        ).toBeVisible();
    }

    /**
     * Assert that step 2 of the create/edit wizard is visible.
     */
    async verifyStep2Visible(): Promise<void> {
        await expect(
            this.stepSetAdConditionsTitle,
            "Step 2 title 'Set ad conditions' should be visible"
        ).toBeVisible();
    }

    /**
     * Assert that the ad creation success screen is fully rendered.
     */
    async verifySuccessScreen(): Promise<void> {
        await expect(
            this.successHeading,
            "Success heading 'Ad created' should be visible after submission"
        ).toBeVisible();
        await expect(
            this.goToMyAdsButton,
            "'Go to My ads' button should be visible on the success screen"
        ).toBeVisible();
    }
}
