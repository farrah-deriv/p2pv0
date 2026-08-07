"use client"

import { Button } from "@/components/ui/button"
import Image from "next/image"
import { useToast } from "@/hooks/use-toast"
import { useIsMobile } from "@/hooks/use-mobile"
import { copyToClipboard, formatAmount, formatDateTime } from "@/lib/utils"
import { useUserDataStore } from "@/stores/user-data-store"
import type { OrderDetailItemProps } from "./types"
import { cn } from "@/lib/utils"
import { useTranslations } from "@/lib/i18n/use-translations"
import { TOAST_SUCCESS_CLASS } from "@/lib/toast-utils"

const OrderDetailItem = ({ hasCopy, label, value, testId, isBlockLayout, copyTestId }: OrderDetailItemProps) => {
  const { toast } = useToast()
  const { t } = useTranslations()

  return (
    <div
      className={cn(!isBlockLayout && "md:flex md:justify-between md:items-center md:border-b md:py-4")}
      data-testid={testId}
    >
      <h3 className="text-sm text-slate-500">{label}</h3>
      <div className={cn("flex justify-between", !isBlockLayout && "md:justify-start md:gap-2")}>
        <p className="text-sm font-bold">{value}</p>
        {hasCopy && (
          <Button
            onClick={async () => {
              const success = await copyToClipboard(String(value))
              if (success) {
                toast({
                  description: (
                    <div className="flex items-center gap-2">
                      <Image src="/icons/tick.svg" alt="Success" width={24} height={24} className="text-white" />
                      <span>{t("orderDetails.textCopiedToClipboard")}</span>
                    </div>
                  ),
                  className: TOAST_SUCCESS_CLASS,
                  duration: 2500,
                })
              }
            }}
            variant="ghost"
            size="sm"
            className="p-0 h-auto"
            data-testid={copyTestId}
          >
            <Image src="/icons/copy-icon.png" alt="Copy" width={24} height={24} className="text-slate-500" />
          </Button>
        )}
      </div>
    </div>
  )
}

export const OrderDetails = ({ order, setShowChat }) => {
  const isMobile = useIsMobile()
  const userId = useUserDataStore((state) => state.userId)
  const { t } = useTranslations()

  if (!order) return null

  const counterpartyNickname =
    order?.advert?.user?.id == userId ? order?.user?.nickname : order?.advert?.user?.nickname

  const isCounterpartyBuyer =
    order?.type === "sell"
      ? order?.advert?.user?.id == userId
        ? false
        : true
      : order?.advert?.user?.id == userId
        ? true
        : false

  const counterpartyLabel = isCounterpartyBuyer ? t("orderDetails.buyer") : t("orderDetails.seller")

  const exchangeRateValue = order.exchange_rate?.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

  const isBlockLayout = order.status === "completed" || isMobile

  // Determine if current user is seller or buyer
  // For "buy" orders: order creator is buyer, advert creator is seller
  // For "sell" orders: order creator is seller, advert creator is buyer
  const isUserSeller =
    (order?.type === "buy" && order?.advert?.user?.id == userId) ||
    (order?.type === "sell" && order?.user?.id == userId)

  // For sellers: show "You send" (USD) and "You receive" (local currency)
  // For buyers: show "You pay" (local currency) and "You receive" (USD)
  const firstLineLabel = isUserSeller ? t("orderDetails.youSend") : t("orderDetails.youPay")
  const firstLineValue = isUserSeller
    ? `${formatAmount(order.amount)} ${order.advert?.account_currency}`
    : `${formatAmount(order.payment_amount)} ${order.payment_currency}`

  const secondLineLabel = isUserSeller ? t("orderDetails.youReceive") : t("orderDetails.youReceive")
  const secondLineValue = isUserSeller
    ? `${formatAmount(order.payment_amount)} ${order.payment_currency}`
    : `${formatAmount(order.amount)} ${order.advert?.account_currency}`

  return (
    <div className={cn("space-y-4", !isBlockLayout && "md:space-y-1")} data-testid="order-details-container">
      <OrderDetailItem
        label={t("orderDetails.orderId")}
        value={order.id}
        testId="order-id-item"
        hasCopy={true}
        isBlockLayout={isBlockLayout}
        copyTestId="order-details-btn-copy-id"
      />

      <OrderDetailItem
        label={t("orderDetails.exchangeRate", { currency: order?.advert?.account_currency })}
        value={`${exchangeRateValue} ${order.payment_currency}`}
        testId="exchange-rate-item"
        isBlockLayout={isBlockLayout}
      />

      <OrderDetailItem
        label={firstLineLabel}
        value={firstLineValue}
        testId="payment-amount-item"
        isBlockLayout={isBlockLayout}
      />

      <OrderDetailItem
        label={secondLineLabel}
        value={secondLineValue}
        testId="amount-item"
        isBlockLayout={isBlockLayout}
      />

      <OrderDetailItem
        label={t("orderDetails.orderTime")}
        value={formatDateTime(order.created_at)}
        testId="order-time-item"
        isBlockLayout={isBlockLayout}
      />

      <div className="flex md:block items-end justify-between">
        <div className={cn("flex-1", isBlockLayout && "space-y-4")}>
          <OrderDetailItem
            label={isCounterpartyBuyer ? t("orderDetails.buyerNickname") : t("orderDetails.sellerNickname")}
            value={counterpartyNickname || ""}
            testId="counterparty-item"
            isBlockLayout={isBlockLayout}
          />
          {order?.counterparty_name && order.status !== "completed" && (
            <OrderDetailItem
              label={isCounterpartyBuyer ? t("orderDetails.buyerRealName") : t("orderDetails.sellerRealName")}
              value={order.counterparty_name}
              testId="counterparty-real-name-item"
              isBlockLayout={isBlockLayout}
            />
          )}
        </div>
        {order.status === "completed" && isMobile && (
          <Button
            onClick={() => {
              setShowChat(true)
            }}
            className="text-slate-500 hover:text-slate-700"
            variant="ghost"
            size="sm"
            data-testid="order-details-btn-chat-mobile"
          >
            <Image src="/icons/chat-icon.png" alt="Chat" width={20} height={20} />
          </Button>
        )}
      </div>
    </div>
  )
}
