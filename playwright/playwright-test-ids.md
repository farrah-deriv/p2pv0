# P2P Web (p2pv0) — Playwright Test IDs

This skill defines all `data-testid` attributes used across the p2pv0 web app for Playwright (and other automated) testing. Every interactive element (CTAs, inputs, forms) and every important informational element (balances, statuses, errors) must carry a `data-testid`.

---

## Convention

```
{page/feature}-{element-type}-{description}
```

- **page/feature**: `login`, `markets`, `ads`, `ad-form`, `orders`, `order-details`, `order-chat`, `advertiser`, `profile`, `wallet`, `transfer`, `sidebar`, `footer-nav`, `order-sidebar`, `rating`, `complaint`, `feedback`, `kyc`, `risk-warning`, `market-filter`, `currency-filter`, `payment-filter`, `block-confirm`, `announcement`, `maintenance`, `mobile-search`
- **element-type**: `input`, `btn`, `form`, `error`, `text`, `link`, `modal`, `sheet`, `card`, `badge`, `tab`, `row`, `select`, `checkbox`, `radio`, `switch`, `sentinel`, `skeleton`, `alert`, `banner`, `avatar`, `menu`
- **description**: kebab-case, meaningful name

> **Rule:** Any component that uses CSS-only responsive toggling (`lg:hidden` / `hidden lg:flex`) must suffix testids with `-mobile` / `-desktop` so each is unique in the DOM. Example: `markets-btn-buy-{adId}` is fine if only one exists per ad, but a CTA that is duplicated for mobile/desktop breakpoints needs `-mobile` / `-desktop`.

---

## Login Module (`/login`)

### Email Step

| Element | `data-testid` |
|---------|---------------|
| Email input | `login-input-email` |
| Submit / Next button | `login-btn-submit` |
| Sign up link (external) | `login-link-signup` |
| API / email error | `login-error-api` |

### OTP Verification Step

| Element | `data-testid` |
|---------|---------------|
| Back button | `login-btn-back` |
| Displayed email | `login-text-email` |
| OTP code input | `login-input-otp` |
| OTP error | `login-error-otp` |
| Resend countdown text | `login-text-resend-timer` |
| Resend code button (after cooldown) | `login-btn-resend` |
| Verify / confirm button | `login-btn-verify` |

---

## Markets Page (`/`) — Home / Buy-Sell

### Tabs & Ad List

| Element | `data-testid` |
|---------|---------------|
| Buy tab | `markets-tab-buy` |
| Sell tab | `markets-tab-sell` |
| Ad list container | `markets-list-ads` |
| Ad card (per ad, use ad ID) | `markets-card-ad-{adId}` |
| Buy button on ad card | `markets-btn-buy-{adId}` |
| Sell button on ad card | `markets-btn-sell-{adId}` |
| Advertiser name link on card | `markets-link-advertiser-{advertiserId}` |
| Exchange rate text (per ad) | `markets-text-rate-{adId}` |
| Order limits text (per ad) | `markets-text-limits-{adId}` |
| Payment methods display (per ad) | `markets-text-payment-{adId}` |
| Infinite scroll sentinel | `markets-sentinel-load-more` |
| Empty state | `markets-empty-state` |
| Loading skeleton | `markets-skeleton-ads` |

### Balance Display

| Element | `data-testid` |
|---------|---------------|
| P2P balance amount | `markets-text-balance` |
| Balance warning banner | `markets-banner-balance-warning` |
| Transfer funds button (in balance warning) | `markets-btn-transfer-warning` |

**Playwright note:** For ad card Buy/Sell buttons, prefer `locator('[data-testid^="markets-btn-buy-"]')` over matching visible button text when tests run under a non-default locale.

---

## Currency Filter (shared — used on Markets)

| Element | `data-testid` |
|---------|---------------|
| Filter trigger button | `currency-filter-btn-trigger` |
| Search input | `currency-filter-input-search` |
| Clear search button | `currency-filter-btn-clear` |
| Currency option item (per currency code) | `currency-filter-btn-{currencyCode}` |

---

## Payment Methods Filter (shared — used on Markets)

| Element | `data-testid` |
|---------|---------------|
| Filter trigger button | `payment-filter-btn-trigger` |
| Payment method search input | `payment-filter-input-search` |
| Clear search button | `payment-filter-btn-clear` |
| Select all checkbox | `payment-filter-checkbox-select-all` |
| Individual method checkbox (per method ID) | `payment-filter-checkbox-{methodId}` |
| Reset button (mobile only) | `payment-filter-btn-reset` |
| Apply button (mobile only) | `payment-filter-btn-apply` |

---

## Market Filter Dropdown (Sort & Following — used on Markets)

| Element | `data-testid` |
|---------|---------------|
| Filter trigger button | `market-filter-btn-trigger` |
| "Ads from following" checkbox | `market-filter-checkbox-following` |
| Sort by tier level radio | `market-filter-radio-sort-tier` |
| Sort by exchange rate radio | `market-filter-radio-sort-rate` |
| Sort by user rating radio | `market-filter-radio-sort-rating` |
| Reset button (mobile only) | `market-filter-btn-reset` |
| Apply button (mobile only) | `market-filter-btn-apply` |

---

## Order Sidebar (place order — shared across Markets & Advertiser)

Opened when a user clicks a Buy/Sell button on an ad card.

| Element | `data-testid` |
|---------|---------------|
| Sidebar container | `order-sidebar-container` |
| Close button | `order-sidebar-btn-close` |
| Amount input | `order-sidebar-input-amount` |
| Amount validation error | `order-sidebar-error-amount` |
| Payment method selector trigger (buy orders) | `order-sidebar-btn-select-payment` |
| Selected payment method label | `order-sidebar-text-payment-method` |
| Place order button | `order-sidebar-btn-place-order` |
| Payment methods modal container | `order-sidebar-modal-payment-methods` |
| Payment method option checkbox (per method ID) | `order-sidebar-checkbox-payment-{methodId}` |
| Add payment method link (inside modal) | `order-sidebar-link-add-payment` |
| Confirm payment method selection button | `order-sidebar-btn-confirm-payment` |

### Rate Change Confirmation (nested modal)

Shown when the ad's rate changes between opening the sidebar and placing the order.

| Element | `data-testid` |
|---------|---------------|
| Modal container | `rate-change-modal` |
| Confirm and continue button | `rate-change-btn-confirm` |
| Go back button | `rate-change-btn-cancel` |

### Ad Updated Confirmation (nested modal)

Shown when the ad details change between opening the sidebar and placing the order.

| Element | `data-testid` |
|---------|---------------|
| Modal container | `ad-updated-modal` |
| Review changes button | `ad-updated-btn-confirm` |
| Cancel button | `ad-updated-btn-cancel` |

---

## Risk Warning Modal (shared — Markets & Advertiser)

Shown for ads with unusual rates, high order limits, or low completion rates.

| Element | `data-testid` |
|---------|---------------|
| Modal container | `risk-warning-modal` |
| Close button (desktop X) | `risk-warning-btn-close` |
| Continue anyway button | `risk-warning-btn-continue` |
| Go back button | `risk-warning-btn-cancel` |

---

## My Ads Page (`/ads`)

| Element | `data-testid` |
|---------|---------------|
| Create ad button | `ads-btn-create` |
| Hide my ads toggle (switch) | `ads-switch-hide-ads` |
| Hide my ads info tooltip trigger | `ads-btn-hide-ads-info` |
| Ad table container | `ads-table-container` |
| Ad row (per ad ID) | `ads-row-{adId}` |
| Ad status badge (per ad ID) | `ads-badge-status-{adId}` |
| Edit ad button (per ad ID) | `ads-btn-edit-{adId}` |
| Delete ad button (per ad ID) | `ads-btn-delete-{adId}` |
| Ad creation success modal (mobile) | `ads-modal-create-success` |
| Temporary ban alert | `ads-alert-temp-ban` |
| Infinite scroll sentinel | `ads-sentinel-load-more` |
| Empty state | `ads-empty-state` |

---

## Ad Form — Create & Edit (`/ads/create`, `/ads/edit/[id]`)

### All Steps (persistent)

| Element | `data-testid` |
|---------|---------------|
| Step progress indicator | `ad-form-progress` |
| Close / cancel button | `ad-form-btn-close` |

### Step 1 — Ad Details

| Element | `data-testid` |
|---------|---------------|
| Buy trade type radio | `ad-form-radio-type-buy` |
| Sell trade type radio | `ad-form-radio-type-sell` |
| Account currency selector | `ad-form-select-account-currency` |
| Payment currency selector | `ad-form-select-payment-currency` |
| Fixed price type radio | `ad-form-radio-price-fixed` |
| Floating price type radio | `ad-form-radio-price-floating` |
| Rate input | `ad-form-input-rate` |
| Rate validation error | `ad-form-error-rate` |
| Minimum order amount input | `ad-form-input-min-amount` |
| Maximum order amount input | `ad-form-input-max-amount` |
| Amount range validation error | `ad-form-error-amount` |
| Next button (step 1) | `ad-form-btn-next-step1` |

### Step 2 — Payment Methods

| Element | `data-testid` |
|---------|---------------|
| Payment method checkbox (per method ID) | `ad-form-checkbox-payment-{methodId}` |
| Add payment method button | `ad-form-btn-add-payment` |
| Payment method bottom sheet | `ad-form-sheet-payment-methods` |
| Next button (step 2) | `ad-form-btn-next-step2` |

### Step 3 — Ad Settings

| Element | `data-testid` |
|---------|---------------|
| Order time limit selector | `ad-form-select-time-limit` |
| Order time limit tooltip trigger | `ad-form-tooltip-time-limit` |
| Country selection list | `ad-form-list-countries` |
| Country checkbox (per country code) | `ad-form-checkbox-country-{countryCode}` |
| Country tooltip trigger | `ad-form-tooltip-countries` |
| Minimum trade band — none radio | `ad-form-radio-band-none` |
| Minimum trade band — silver radio | `ad-form-radio-band-silver` |
| Minimum trade band — gold radio | `ad-form-radio-band-gold` |
| Minimum trade band — diamond radio | `ad-form-radio-band-diamond` |
| Trade band tooltip trigger | `ad-form-tooltip-trade-band` |
| Ad visibility — everyone radio | `ad-form-radio-visibility-everyone` |
| Ad visibility — closed group radio | `ad-form-radio-visibility-closed-group` |
| Ad visibility tooltip trigger | `ad-form-tooltip-visibility` |
| Create / save changes button | `ad-form-btn-submit` |
| API error | `ad-form-error-api` |

### Post-Create Success Screen

| Element | `data-testid` |
|---------|---------------|
| Created ad ID text | `ad-form-text-created-id` |
| Share ad button | `ad-form-btn-share` |
| Done button | `ad-form-btn-done` |

---

## Orders Page (`/orders`)

| Element | `data-testid` |
|---------|---------------|
| Active orders tab | `orders-tab-active` |
| Past orders tab | `orders-tab-past` |
| Date filter selector | `orders-select-date-filter` |
| Order row (per order ID) | `orders-row-{orderId}` |
| Order status badge (per order ID) | `orders-badge-status-{orderId}` |
| Time remaining countdown (per order ID) | `orders-text-time-remaining-{orderId}` |
| Rate button (per completed order ID) | `orders-btn-rate-{orderId}` |
| Chat button (per order ID) | `orders-btn-chat-{orderId}` |
| Previous orders section | `orders-section-previous` |
| Check previous orders button (v1 users) | `orders-btn-check-previous` |
| KYC popup alert | `orders-alert-kyc` |
| Temporary ban alert | `orders-alert-temp-ban` |
| Empty state | `orders-empty-state` |
| Loading skeleton | `orders-skeleton` |

---

## Order Details Page (`/orders/[id]`)

### Header & Status

| Element | `data-testid` |
|---------|---------------|
| Back button | `order-details-btn-back` |
| Order ID text | `order-details-text-order-id` |
| Copy order ID button | `order-details-btn-copy-id` |
| Order status badge | `order-details-badge-status` |
| Time remaining countdown | `order-details-text-time-remaining` |
| View order details button (opens detail panel) | `order-details-btn-view-details` |

### Payment Info

| Element | `data-testid` |
|---------|---------------|
| Payment method accordion | `order-details-accordion-payment` |
| Copy field button (per field key) | `order-details-btn-copy-{fieldKey}` |
| Payment field value text (per field key) | `order-details-text-{fieldKey}` |

### Action Buttons

The visible set of buttons changes based on the current user's role (buyer/seller) and order status.

| Element | `data-testid` |
|---------|---------------|
| Cancel order button | `order-details-btn-cancel` |
| I've paid button (buyer, `pending_payment`) | `order-details-btn-paid` |
| I've received payment button (seller, `buyer-confirmed`) | `order-details-btn-received` |
| Rate transaction button (post-completion) | `order-details-btn-rate` |
| Make complaint button (timed-out) | `order-details-btn-complaint` |

### Payment Confirmation Sidebars/Sheets

| Element | `data-testid` |
|---------|---------------|
| Payment confirmation sidebar | `order-details-sheet-confirm-payment` |
| Payment received confirmation sidebar | `order-details-sheet-confirm-received` |
| OTP input (when `orderVerificationEnabled`) | `order-details-input-otp` |
| OTP error | `order-details-error-otp` |
| Confirm payment button | `order-details-btn-confirm-payment` |
| Confirm received button | `order-details-btn-confirm-received` |

### Cancel Confirmation

| Element | `data-testid` |
|---------|---------------|
| Cancel confirmation alert/dialog | `order-details-alert-cancel` |
| Confirm cancel button | `order-details-btn-confirm-cancel` |
| Keep order button | `order-details-btn-keep-order` |

---

## Order Chat (`order-chat.tsx` — inline on `/orders/[id]`)

On desktop: fixed-height sidebar panel. On mobile: full-screen, replaces order detail view.

| Element | `data-testid` |
|---------|---------------|
| Chat container | `order-chat-container` |
| Back button (mobile full-screen) | `order-chat-btn-back` |
| Message input (textarea) | `order-chat-input-message` |
| Send message button | `order-chat-btn-send` |
| Attach file button (shown when input is empty) | `order-chat-btn-attach` |
| File input (hidden, triggered by attach button) | `order-chat-input-file` |
| Message bubble (per message ID) | `order-chat-msg-{messageId}` |
| Download attachment link (per message ID) | `order-chat-link-download-{messageId}` |

---

## Rating Sidebar (post-order rating)

Opened via `orders-btn-rate-{orderId}` or `order-details-btn-rate`. Desktop: right sidebar. Mobile: bottom sheet.

| Element | `data-testid` |
|---------|---------------|
| Rating sidebar container | `rating-sidebar-container` |
| Star button (1–5) | `rating-btn-star-{n}` |
| Recommend yes button | `rating-btn-recommend-yes` |
| Recommend no button | `rating-btn-recommend-no` |
| Submit button | `rating-btn-submit` |
| API error | `rating-error-api` |

---

## Complaint Form (dispute)

Opened via `order-details-btn-complaint`.

| Element | `data-testid` |
|---------|---------------|
| Complaint form container | `complaint-form-container` |
| Back button | `complaint-btn-back` |
| Complaint reason tile (per reason code) | `complaint-btn-reason-{reasonCode}` |
| Confirmation checkbox | `complaint-checkbox-confirm` |
| Submit dispute button | `complaint-btn-submit` |
| API error | `complaint-error-api` |

---

## Advertiser Profile Page (`/advertiser/[id]`)

### Header & Stats

| Element | `data-testid` |
|---------|---------------|
| Back button | `advertiser-btn-back` |
| Advertiser nickname text | `advertiser-text-nickname` |
| Online status indicator | `advertiser-badge-online-status` |
| Last seen text (when offline) | `advertiser-text-last-seen` |
| Average rating text | `advertiser-text-rating` |
| Recommendation count | `advertiser-text-recommendation` |
| Total order count | `advertiser-text-order-count` |
| 30-day completion rate | `advertiser-text-completion-rate` |
| KYC verified badge | `advertiser-badge-verified` |
| Trade band badge (Silver/Gold/Diamond) | `advertiser-badge-trade-band` |
| Closed group badge | `advertiser-badge-closed-group` |

### Actions

| Element | `data-testid` |
|---------|---------------|
| Follow button (when not following) | `advertiser-btn-follow` |
| Unfollow / Following button (when following) | `advertiser-btn-unfollow` |
| Add to closed group button (Diamond only) | `advertiser-btn-add-closed-group` |
| Remove from closed group button (Diamond only) | `advertiser-btn-remove-closed-group` |
| Block button | `advertiser-btn-block` |
| Unblock button | `advertiser-btn-unblock` |

### Ads Table

| Element | `data-testid` |
|---------|---------------|
| Buy tab | `advertiser-tab-buy` |
| Sell tab | `advertiser-tab-sell` |
| Ad row (per ad ID) | `advertiser-row-ad-{adId}` |
| Buy / Sell button (per ad ID) | `advertiser-btn-trade-{adId}` |
| Exchange rate text (per ad ID) | `advertiser-text-rate-{adId}` |
| Order limits text (per ad ID) | `advertiser-text-limits-{adId}` |
| Empty state | `advertiser-empty-ads` |
| Error / retry state | `advertiser-error-load` |

---

## Block Confirmation Modal (shared)

Opened from `advertiser-btn-block` or profile blocked tab.

| Element | `data-testid` |
|---------|---------------|
| Modal / sheet container | `block-confirm-modal` |
| Confirm block button | `block-confirm-btn-block` |
| Cancel button | `block-confirm-btn-cancel` |

---

## User Profile Page (`/profile`)

### User Info Card

| Element | `data-testid` |
|---------|---------------|
| User avatar / initials circle | `profile-avatar` |
| Username text | `profile-text-username` |
| Email text | `profile-text-email` |
| Average rating text | `profile-text-rating` |
| Recommendation count | `profile-text-recommendation` |
| Total order count | `profile-text-order-count` |
| KYC verified badge | `profile-badge-verified` |
| Trade band badge | `profile-badge-trade-band` |
| Trade limits display | `profile-text-trade-limits` |
| P2P access removed message | `profile-msg-access-removed` |
| Temporary ban alert | `profile-alert-temp-ban` |

### Stats Tabs (desktop)

| Element | `data-testid` |
|---------|---------------|
| Stats tab | `profile-tab-stats` |
| Payment methods tab | `profile-tab-payment-methods` |
| Follows tab | `profile-tab-follows` |
| Blocked tab | `profile-tab-blocked` |
| Counterparties tab | `profile-tab-counterparties` |
| Closed group tab (Diamond only) | `profile-tab-closed-group` |

### Section Menu Items (mobile)

| Element | `data-testid` |
|---------|---------------|
| Stats menu item | `profile-menu-stats` |
| Payment methods menu item | `profile-menu-payment-methods` |
| Follows menu item | `profile-menu-follows` |
| Blocked menu item | `profile-menu-blocked` |
| Counterparties menu item | `profile-menu-counterparties` |
| Closed group menu item (Diamond only) | `profile-menu-closed-group` |
| Help centre menu item | `profile-menu-help` |
| Send feedback menu item | `profile-menu-feedback` |
| Back button (in section sidebars) | `profile-btn-sidebar-back` |

### Payment Methods

| Element | `data-testid` |
|---------|---------------|
| Add payment method button | `profile-btn-add-payment` |
| Payment method card (per method ID) | `profile-card-payment-{methodId}` |
| Edit dropdown trigger (per method ID) | `profile-btn-edit-payment-{methodId}` |
| Delete option (per method ID) | `profile-btn-delete-payment-{methodId}` |
| Confirm delete button | `profile-btn-confirm-delete-payment` |
| Cancel delete button | `profile-btn-cancel-delete-payment` |
| Error retry button | `profile-btn-retry-payment` |
| Empty state add payment button | `profile-btn-empty-add-payment` |

---

## Wallet Page (`/wallet`)

### Balance Overview

| Element | `data-testid` |
|---------|---------------|
| Wallet page container | `wallet-container` |
| Back button (from transaction view) | `wallet-btn-back` |
| Total P2P balance text | `wallet-text-total-balance` |
| Balance card (per currency code) | `wallet-card-balance-{currency}` |
| Balance amount (per currency code) | `wallet-text-balance-{currency}` |
| Deposit button | `wallet-btn-deposit` |
| Buy button | `wallet-btn-buy` |
| Transfer button | `wallet-btn-transfer` |
| Sell button | `wallet-btn-sell` |
| Loading skeleton | `wallet-skeleton` |
| Empty state | `wallet-empty-state` |
| Temporary ban alert | `wallet-alert-temp-ban` |
| P2P access removed message | `wallet-msg-access-removed` |

### Transactions List

| Element | `data-testid` |
|---------|---------------|
| Transaction row (per transaction ID) | `wallet-row-tx-{transactionId}` |
| Transaction amount text (per ID) | `wallet-text-tx-amount-{transactionId}` |
| Transaction date text (per ID) | `wallet-text-tx-date-{transactionId}` |
| Transaction type badge (per ID) | `wallet-badge-tx-type-{transactionId}` |
| Transaction details view | `wallet-details-tx` |
| Infinite scroll sentinel | `wallet-sentinel-load-more` |
| Empty transactions state | `wallet-empty-transactions` |

### Wallet Sidebar (deposit / withdraw / transfer entry)

| Element | `data-testid` |
|---------|---------------|
| Wallet sidebar container | `wallet-sidebar-container` |
| Close button | `wallet-sidebar-btn-close` |
| Deposit option row | `wallet-sidebar-btn-deposit` |
| Withdraw option row | `wallet-sidebar-btn-withdraw` |
| Transfer option row | `wallet-sidebar-btn-transfer` |

---

## Transfer Flow (`/wallet` — opened from `wallet-btn-transfer`)

Desktop: right-panel sidebar. Mobile: full-screen flow.

### Main Screen

| Element | `data-testid` |
|---------|---------------|
| Transfer container | `transfer-container` |
| Close button (X) | `transfer-btn-close` |
| Back button | `transfer-btn-back` |
| From wallet selector (empty) | `transfer-btn-select-from` |
| From wallet selector (filled) | `transfer-btn-account-from` |
| To wallet selector (empty) | `transfer-btn-select-to` |
| To wallet selector (filled) | `transfer-btn-account-to` |
| Swap wallets button | `transfer-btn-swap` |
| Amount input | `transfer-input-amount` |
| Amount validation error | `transfer-error-amount` |
| 25% quick-fill button | `transfer-btn-pct-25` |
| 50% quick-fill button | `transfer-btn-pct-50` |
| 75% quick-fill button | `transfer-btn-pct-75` |
| 100% quick-fill button | `transfer-btn-pct-100` |
| Transfer / Review button | `transfer-btn-submit` |

### Wallet Picker Sheet

| Element | `data-testid` |
|---------|---------------|
| Wallet picker sheet (mobile) | `transfer-sheet-wallet-picker` |
| Sheet drag grip | `transfer-sheet-wallet-picker-grip` |
| Close button (desktop) | `transfer-sheet-wallet-picker-btn-close` |
| Wallet option row (per wallet ID) | `transfer-btn-wallet-{walletId}` |

### Confirm Sheet

| Element | `data-testid` |
|---------|---------------|
| Confirm transfer sheet | `transfer-sheet-confirm` |
| Sheet drag grip | `transfer-sheet-confirm-grip` |
| Close button (desktop) | `transfer-sheet-confirm-btn-close` |
| Confirm button | `transfer-btn-confirm` |

### Success / Error States

| Element | `data-testid` |
|---------|---------------|
| Success — view details button | `transfer-success-btn-details` |
| Success — done / close button | `transfer-success-btn-done` |
| Error — try again button | `transfer-error-btn-retry` |
| Error — contact us button | `transfer-error-btn-contact` |
| Error — not now button | `transfer-error-btn-cancel` |

---

## Sidebar Navigation (desktop, `sidebar.tsx`)

| Element | `data-testid` |
|---------|---------------|
| Sidebar container | `sidebar-container` |
| User avatar / initials | `sidebar-avatar` |
| Advertiser search input | `sidebar-input-search` |
| Search clear button | `sidebar-btn-search-clear` |
| Search — buy tab | `sidebar-tab-search-buy` |
| Search — sell tab | `sidebar-tab-search-sell` |
| Search result card (per advertiser ID) | `sidebar-card-search-{advertiserId}` |
| Nav link — home (external) | `sidebar-link-home` |
| Nav link — markets | `sidebar-link-markets` |
| Nav link — orders | `sidebar-link-orders` |
| Nav link — my ads | `sidebar-link-ads` |
| Nav link — wallet (v2 only) | `sidebar-link-wallet` |
| Nav link — profile | `sidebar-link-profile` |
| Nav link — help centre (external) | `sidebar-link-help` |
| Live chat button (Intercom) | `sidebar-btn-livechat` |
| Send feedback button | `sidebar-btn-feedback` |
| Notifications bell button | `sidebar-btn-notifications` |
| Notification item (per order ID) | `sidebar-notification-item-{orderId}` |

---

## Mobile Footer Navigation (`mobile-footer-nav.tsx`)

Hidden on specific routes (order details, chat, transaction list).

| Element | `data-testid` |
|---------|---------------|
| Footer nav container | `footer-nav-container` |
| Home link | `footer-nav-link-home` |
| Markets link | `footer-nav-link-markets` |
| Orders link | `footer-nav-link-orders` |
| My Ads link | `footer-nav-link-ads` |
| Wallet link (v2 users only) | `footer-nav-link-wallet` |
| Profile link | `footer-nav-link-profile` |

---

## Header (`header.tsx` — desktop tab nav)

Hidden on advertiser, order detail, and ad form routes.

| Element | `data-testid` |
|---------|---------------|
| Header container | `header-container` |
| Markets nav tab | `header-tab-markets` |
| Orders nav tab | `header-tab-orders` |
| My Ads nav tab | `header-tab-ads` |
| Wallet nav tab (v2 only) | `header-tab-wallet` |
| Profile nav tab | `header-tab-profile` |
| Mobile sidebar trigger button | `header-btn-mobile-sidebar` |
| Notifications button | `header-btn-notifications` |

---

## Mobile Advertiser Search Sheet

Opened from the mobile header search icon.

| Element | `data-testid` |
|---------|---------------|
| Sheet container | `mobile-search-sheet` |
| Back button | `mobile-search-btn-back` |
| Search input | `mobile-search-input` |
| Clear search button | `mobile-search-btn-clear` |
| Buy tab | `mobile-search-tab-buy` |
| Sell tab | `mobile-search-tab-sell` |
| Advertiser result card (per advertiser ID) | `mobile-search-card-{advertiserId}` |
| Advertiser name button (per advertiser ID) | `mobile-search-btn-advertiser-{advertiserId}` |
| Buy / Sell button in result card (per ad ID) | `mobile-search-btn-trade-{adId}` |
| Infinite scroll sentinel | `mobile-search-sentinel-load-more` |

---

## KYC Onboarding Sheet (`kyc-onboarding-sheet.tsx`)

Shown when a user attempts an action requiring KYC verification.

| Element | `data-testid` |
|---------|---------------|
| Sheet container | `kyc-sheet-container` |
| Close button (mobile drawer) | `kyc-btn-close` |
| Step row (per step key: `profile`, `phone`, `poi`, `poa`) | `kyc-row-step-{stepKey}` |
| Step status icon (per step key) | `kyc-icon-step-{stepKey}` |
| Primary CTA button (label varies by incomplete step) | `kyc-btn-primary-cta` |

---

## P2P Announcement Modal (`p2p-announcement.tsx`)

Desktop: centered dialog. Mobile: bottom sheet.

| Element | `data-testid` |
|---------|---------------|
| Modal / sheet container | `announcement-modal` |
| Carousel slide dot (per index) | `announcement-dot-{index}` |
| Primary CTA button | `announcement-btn-primary` |
| Secondary CTA button (when present) | `announcement-btn-secondary` |
| Close button (desktop X) | `announcement-btn-close` |

---

## System Maintenance Banner (`p2p-system-maintenance-banner.tsx`)

Shown app-wide when P2P is under maintenance.

| Element | `data-testid` |
|---------|---------------|
| Maintenance banner container | `maintenance-banner` |
| Live chat link button | `maintenance-link-livechat` |

---

## P2P Balance Warning (`p2p-balance-warning.tsx`)

Shown when P2P account balance is empty.

| Element | `data-testid` |
|---------|---------------|
| Balance warning banner | `balance-warning-banner` |
| Transfer funds button | `balance-warning-btn-transfer` |

---

## Feedback Dialog & NPS Survey

Opened from `sidebar-btn-feedback` or `profile-menu-feedback`. Shows only if user has not yet submitted feedback.

| Element | `data-testid` |
|---------|---------------|
| Feedback dialog container | `feedback-dialog` |
| Close button | `feedback-btn-close` |
| Star rating button (1–5) | `feedback-btn-star-{n}` |
| NPS score button (0–10) | `feedback-btn-score-{n}` |
| Recommend yes button | `feedback-btn-recommend-yes` |
| Recommend no button | `feedback-btn-recommend-no` |
| Feedback textarea | `feedback-input-text` |
| Character counter text | `feedback-text-char-count` |
| Submit button | `feedback-btn-submit` |
| Ask me later button | `feedback-btn-later` |

---

## How to Apply

Add `data-testid` directly to HTML elements. For Radix-based `components/ui/` primitives (Button, Input, etc.), add it to the wrapper `<div>` if the component doesn't forward arbitrary props, or directly to the element when it does.

```tsx
// Native button
<button type="button" data-testid="markets-btn-buy-123">Buy</button>

// UI primitive — add directly (Input forwards props)
<Input data-testid="login-input-email" />

// UI primitive — wrap when prop is not forwarded
<div data-testid="login-btn-submit">
  <Button>Log in</Button>
</div>

// Informational text
<p data-testid="markets-text-balance">{balance}</p>

// Dynamic IDs
<div data-testid={`orders-row-${orderId}`}>
<button data-testid={`orders-btn-rate-${orderId}`}>Rate</button>
```

> **Gotcha — Radix Button wrapper:** `getByTestId('login-btn-submit')` selects the `<div>`, not the inner `<button>`. Calling `.click()` still works, but `locator.isDisabled()` returns `false` even when the inner button is disabled. To assert disabled state:
> ```ts
> await expect(page.getByTestId('login-btn-submit').locator('button')).toBeDisabled();
> ```

---

## Playwright Usage Examples

```typescript
// Click a CTA
await page.getByTestId('login-btn-submit').click();

// Fill an input
await page.getByTestId('login-input-email').fill('user@example.com');

// Assert error is visible
await expect(page.getByTestId('login-error-api')).toBeVisible();

// Assert balance amount
await expect(page.getByTestId('markets-text-balance')).toHaveText('1,500.00 USD');

// Click a dynamic order row
await page.getByTestId('orders-row-ABC123').click();

// Use prefix match for Buy buttons (locale-agnostic)
await page.locator('[data-testid^="markets-btn-buy-"]').first().click();

// Assert order status badge
await expect(page.getByTestId('order-details-badge-status')).toContainText('Pending');

// Assert rating button star 4 is visible before clicking
await page.getByTestId('rating-btn-star-4').click();
await page.getByTestId('rating-btn-submit').click();
```

---

## Checklist for New Components

When adding a new page or component:

- [ ] Every `<button>`, `<a>`, `<input>`, `<form>`, `<select>`, `<textarea>` has a `data-testid`
- [ ] Every error / success / validation message has a `data-testid`
- [ ] Every important displayed value (balance, email, order ID, status) has a `data-testid`
- [ ] Dynamic elements use the pattern `{prefix}-{id}` (e.g. `orders-row-ABC123`)
- [ ] IDs are unique per page — no two elements share the same `data-testid`
- [ ] CSS-only responsive duplicates use `-mobile` / `-desktop` suffix
- [ ] `type="button"` on buttons that are not form-submit buttons
- [ ] Tabs use `{feature}-tab-{name}` pattern; active tab state is asserted via `aria-selected` not by text
