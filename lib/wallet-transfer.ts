// ── Canonical code list ────────────────────────────────────────────────────
// These match context.errors[0].code values returned by Core on wallet transfers.
// Backend may also surface WITHDRAWAL_REJECTED_* prefix variants — those are
// normalised to the canonical form via ALIASES below.

export const WALLET_WITHDRAWAL_REJECTION_CODES = [
    "WITHDRAWAL_NOT_ALLOWED",
    "LOW_TRADING_ACTIVITY",
    "NO_PREVIOUS_DEPOSIT",
    "CREDIT_CARD_SETTLE_FIRST",
    "HIGH_RISK_METHOD_SETTLE_FIRST",
    "METHOD_NOT_USED_PREVIOUSLY",
    "CC_MIN_WITHDRAWAL_AMOUNT",
    "EXCEEDS_NET_DEPOSIT_LIMIT",
    "USE_CREDIT_CARD_FOR_WITHDRAWAL",
    "AMOUNT_BELOW_THRESHOLD_METHOD_UNUSED",
    "EXCEEDS_NET_DEPOSIT_INSUFFICIENT_FUNDS",
    "NO_POSITIVE_NET_DEPOSIT_FOR_METHOD",
    "PROFIT_EXCEEDS_THRESHOLD",
    "DAILY_PAYOUT_LIMIT_EXCEEDED",
    "BALANCE_TOO_HIGH",
] as const;

export type WalletWithdrawalRejectionCode =
    (typeof WALLET_WITHDRAWAL_REJECTION_CODES)[number];

export type WalletWithdrawalRejectionCta =
    | "contact_us"
    | "got_it"
    | "deposit_now"
    | "change_method"
    | "make_changes"
    | "got_it_contact_us";

export interface WalletWithdrawalRejectionAmounts {
    required_volume?: string;
    deposit_amount?: string;
    min_amount?: string;
    max_amount?: string;
    min_threshold?: string;
    available_balance?: string;
    withdrawal_amount?: string;
    daily_limit?: string;
    withdrawn_today?: string;
}

export interface WalletWithdrawalRejectionInfo {
    code: WalletWithdrawalRejectionCode;
    cta: WalletWithdrawalRejectionCta;
    amounts: WalletWithdrawalRejectionAmounts;
    message: string;
}

// ── Raw context shape from Core ────────────────────────────────────────────

export interface WalletTransferContextError {
    code?: string;
    message?: string;
    authorizer_message?: string;
}

export interface WalletTransferContext {
    code?: string;
    errors?: WalletTransferContextError[];
}

export interface WalletTransferApiError {
    status?: number;
    message?: string;
    code?: string;
    context?: WalletTransferContext;
}

// ── Backend alias → canonical code ────────────────────────────────────────
// Core uses WITHDRAWAL_REJECTED_* prefix variants and sometimes bare codes.
// All are normalised to the canonical form via ALIASES below.
const ALIASES: Record<string, WalletWithdrawalRejectionCode> = {
    WITHDRAWAL_REJECTED: "WITHDRAWAL_NOT_ALLOWED",
    WITHDRAWAL_REJECTED_INSUFFICIENT_TRADING: "LOW_TRADING_ACTIVITY",
    WITHDRAWAL_REJECTED_SAME_METHOD_REQUIRED: "USE_CREDIT_CARD_FOR_WITHDRAWAL",
    WITHDRAWAL_REJECTED_NOT_ALLOWED: "WITHDRAWAL_NOT_ALLOWED",
    WITHDRAWAL_REJECTED_NO_PREVIOUS_DEPOSIT: "NO_PREVIOUS_DEPOSIT",
    WITHDRAWAL_REJECTED_CREDIT_CARD_SETTLE_FIRST: "CREDIT_CARD_SETTLE_FIRST",
    WITHDRAWAL_REJECTED_HIGH_RISK_METHOD_SETTLE_FIRST:
        "HIGH_RISK_METHOD_SETTLE_FIRST",
    WITHDRAWAL_REJECTED_METHOD_NOT_USED_PREVIOUSLY:
        "METHOD_NOT_USED_PREVIOUSLY",
    WITHDRAWAL_REJECTED_CC_MIN_WITHDRAWAL_AMOUNT: "CC_MIN_WITHDRAWAL_AMOUNT",
    WITHDRAWAL_REJECTED_EXCEEDS_NET_DEPOSIT_LIMIT: "EXCEEDS_NET_DEPOSIT_LIMIT",
    WITHDRAWAL_REJECTED_USE_CREDIT_CARD_FOR_WITHDRAWAL:
        "USE_CREDIT_CARD_FOR_WITHDRAWAL",
    WITHDRAWAL_REJECTED_AMOUNT_BELOW_THRESHOLD_METHOD_UNUSED:
        "AMOUNT_BELOW_THRESHOLD_METHOD_UNUSED",
    WITHDRAWAL_REJECTED_EXCEEDS_NET_DEPOSIT_INSUFFICIENT_FUNDS:
        "EXCEEDS_NET_DEPOSIT_INSUFFICIENT_FUNDS",
    WITHDRAWAL_REJECTED_NO_POSITIVE_NET_DEPOSIT_FOR_METHOD:
        "NO_POSITIVE_NET_DEPOSIT_FOR_METHOD",
    WITHDRAWAL_REJECTED_PROFIT_EXCEEDS_THRESHOLD: "PROFIT_EXCEEDS_THRESHOLD",
    WITHDRAWAL_REJECTED_DAILY_PAYOUT_LIMIT_EXCEEDED:
        "DAILY_PAYOUT_LIMIT_EXCEEDED",
    WITHDRAWAL_REJECTED_BALANCE_TOO_HIGH: "BALANCE_TOO_HIGH",
};

const CODE_SET = new Set<string>(WALLET_WITHDRAWAL_REJECTION_CODES);

function toCanonical(raw: string): WalletWithdrawalRejectionCode | null {
    if (CODE_SET.has(raw)) return raw as WalletWithdrawalRejectionCode;
    return ALIASES[raw] ?? null;
}

// ── CTA mapping ────────────────────────────────────────────────────────────
const CTA_MAP: Record<WalletWithdrawalRejectionCode, WalletWithdrawalRejectionCta> = {
    WITHDRAWAL_NOT_ALLOWED: "contact_us",
    LOW_TRADING_ACTIVITY: "got_it",
    NO_PREVIOUS_DEPOSIT: "deposit_now",
    CREDIT_CARD_SETTLE_FIRST: "got_it",
    HIGH_RISK_METHOD_SETTLE_FIRST: "got_it",
    METHOD_NOT_USED_PREVIOUSLY: "change_method",
    CC_MIN_WITHDRAWAL_AMOUNT: "make_changes",
    EXCEEDS_NET_DEPOSIT_LIMIT: "make_changes",
    USE_CREDIT_CARD_FOR_WITHDRAWAL: "make_changes",
    AMOUNT_BELOW_THRESHOLD_METHOD_UNUSED: "make_changes",
    EXCEEDS_NET_DEPOSIT_INSUFFICIENT_FUNDS: "make_changes",
    NO_POSITIVE_NET_DEPOSIT_FOR_METHOD: "make_changes",
    PROFIT_EXCEEDS_THRESHOLD: "got_it",
    DAILY_PAYOUT_LIMIT_EXCEEDED: "got_it_contact_us",
    BALANCE_TOO_HIGH: "contact_us",
};

// ── Amount extraction helpers ──────────────────────────────────────────────

/** "Not enough trading, ER 0 less(or equal) than 4.6557 (3 percent of 155.19)" → "4.6557" */
function extractLowTradingVolume(
    inner: WalletTransferContextError,
): string | undefined {
    const src = inner.authorizer_message ?? inner.message ?? "";
    const m = /less\s*(?:\(or\s+equal\))?\s*than\s+([\d.]+)/i.exec(src);
    return m ? m[1] : undefined;
}

/** "Credit card withdrawal requires minimum amount of $50" → "50" */
function extractCcMinAmount(inner: WalletTransferContextError): string | undefined {
    const src = inner.authorizer_message ?? inner.message ?? "";
    const m = /minimum\s+amount\s+of\s+\$?([\d.]+)/i.exec(src);
    if (m) return m[1];
    const m2 = /\$?([\d]+(?:\.\d+)?)/i.exec(src);
    return m2 ? m2[1] : undefined;
}

function extractFirstAmount(src: string): string | undefined {
    const m =
        /(?:USD\s*)?([\d]+(?:\.\d+)?)/i.exec(src.replace(/,/g, "")) ?? null;
    if (!m) return undefined;
    const val = parseFloat(m[1]);
    return isNaN(val) ? undefined : String(val);
}

function extractDepositAmount(inner: WalletTransferContextError): string | undefined {
    const src = inner.authorizer_message ?? inner.message ?? "";
    return extractFirstAmount(src);
}

function extractDailyLimitAmounts(
    inner: WalletTransferContextError,
): { withdrawn_today?: string; daily_limit?: string } {
    const src = inner.authorizer_message ?? inner.message ?? "";
    const nums = [...src.matchAll(/([\d,]+(?:\.\d+)?)/g)]
        .map(m => m[1].replace(/,/g, ""))
        .filter(s => !isNaN(parseFloat(s)));
    return {
        withdrawn_today: nums[0],
        daily_limit: nums[1],
    };
}

function extractAmountsForCode(
    code: WalletWithdrawalRejectionCode,
    inner: WalletTransferContextError,
): WalletWithdrawalRejectionAmounts {
    switch (code) {
        case "LOW_TRADING_ACTIVITY":
            return { required_volume: extractLowTradingVolume(inner) };

        case "CREDIT_CARD_SETTLE_FIRST":
        case "HIGH_RISK_METHOD_SETTLE_FIRST":
            return { deposit_amount: extractDepositAmount(inner) };

        case "CC_MIN_WITHDRAWAL_AMOUNT":
            return { min_amount: extractCcMinAmount(inner) };

        case "EXCEEDS_NET_DEPOSIT_LIMIT": {
            const src = inner.authorizer_message ?? inner.message ?? "";
            return { max_amount: extractFirstAmount(src) };
        }

        case "AMOUNT_BELOW_THRESHOLD_METHOD_UNUSED": {
            const src = inner.authorizer_message ?? inner.message ?? "";
            return { min_threshold: extractFirstAmount(src) };
        }

        case "EXCEEDS_NET_DEPOSIT_INSUFFICIENT_FUNDS": {
            const src = inner.authorizer_message ?? inner.message ?? "";
            return { available_balance: extractFirstAmount(src) };
        }

        case "PROFIT_EXCEEDS_THRESHOLD": {
            const src = inner.authorizer_message ?? inner.message ?? "";
            return { withdrawal_amount: extractFirstAmount(src) };
        }

        case "DAILY_PAYOUT_LIMIT_EXCEEDED":
            return extractDailyLimitAmounts(inner);

        default:
            return {};
    }
}

// ── Main extraction function ───────────────────────────────────────────────

/**
 * Given a single error object from the API response `errors` array, if it
 * contains a recognised withdrawal rejection code, returns structured display
 * info including the most specific human-readable message.
 * Returns `null` if the error is not a handled withdrawal rejection.
 */
export function getWalletTransferRejectionInfo(
    error: WalletTransferApiError,
): WalletWithdrawalRejectionInfo | null {
    const ctx = error.context;

    // Resolution order:
    //   1. context.errors[0].code  (most specific)
    //   2. context.code
    //   3. error.code              (top-level code when context is absent)
    const innerErrors = ctx?.errors ?? [];
    const innerCode = (
        innerErrors[0]?.code ?? ctx?.code ?? error.code ?? ""
    ).trim();

    if (!innerCode) return null;

    const canonical = toCanonical(innerCode);
    if (!canonical) return null;

    const inner: WalletTransferContextError = innerErrors[0] ?? {};
    const amounts = extractAmountsForCode(canonical, inner);

    // Prefer the nested context error message as it is more specific than the
    // top-level message (e.g. "Withdrawal rejected: insufficient trading activity."
    // vs "Withdrawal rejected.").
    const message =
        inner.message || ctx?.errors?.[0]?.message || error.message || "";

    return {
        code: canonical,
        cta: CTA_MAP[canonical],
        amounts,
        message,
    };
}
