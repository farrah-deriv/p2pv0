import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { cn, IS_CLOSED_GROUP_ENABLED } from "@/lib/utils"
import { getHelpCentreUrl } from "@/lib/get-help-centre-url"
import StatsGrid from "./stats-grid"
import PaymentMethodsTab from "./payment-methods-tab"
import FollowsTab from "./follows-tab"
import BlockedTab from "./blocked-tab"
import ClosedGroupTab from "./closed-group"
import CounterpartiesTab from "./counterparties-tab"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Divider } from "@/components/ui/divider"
import AddPaymentMethodPanel from "./add-payment-method-panel"
import { useIsMobile } from "@/lib/hooks/use-is-mobile"
import Image from "next/image"
import { BackArrowIcon } from "@/components/ui/back-arrow-icon"
import { RTL_MIRROR_ICON } from "@/lib/rtl"
import { useAlertDialog } from "@/hooks/use-alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { useUserDataStore } from "@/stores/user-data-store"
import { createKycOnboardingAlertConfig } from "@/components/kyc-onboarding-sheet"
import { useTranslations } from "@/lib/i18n/use-translations"
import { Skeleton } from "@/components/ui/skeleton"
import { useAddPaymentMethod, type PaymentMethodError } from "@/hooks/use-api-queries"
import { createPaymentMethodDuplicateAlertConfig } from "@/lib/payment-methods/create-payment-method-duplicate-alert-config"
import { useTrackers } from "@/analytics/useTrackers"
import { FeedbackDialog } from "@/components/feedback/feedback-dialog"

interface StatsTabsProps {
  stats?: any
  isLoading?: boolean,
  activeTab: string
  maintenanceActive?: boolean
}

const profileTabTrackerMap: Record<string, string> = {
  stats: "ek_my_stats_profile",
  payment: "ek_payment_methods_profile",
  follows: "ek_following_profile",
  blocked: "ek_blocked_users_profile",
  counterparties: "ek_trade_partners_profile",
  "closed-group": "ek_closed_group_profile",
}

export default function StatsTabs({ stats, isLoading, activeTab, maintenanceActive = false }: StatsTabsProps) {
  const router = useRouter()
  const { track } = useTrackers()
  const isMobile = useIsMobile()
  const { hideAlert, showAlert } = useAlertDialog()
  const [showStatsSidebar, setShowStatsSidebar] = useState(false)
  const [showPaymentMethodsSidebar, setShowPaymentMethodsSidebar] = useState(false)
  const [showFollowsSidebar, setShowFollowsSidebar] = useState(false)
  const [showBlockedSidebar, setShowBlockedSidebar] = useState(false)
  const [showClosedGroupSidebar, setShowClosedGroupSidebar] = useState(false)
  const [showCounterpartiesSidebar, setShowCounterpartiesSidebar] = useState(false)
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false)
  const [selectedTab, setSelectedTab] = useState(activeTab)
  const { toast } = useToast()
  const [showAddPaymentSheet, setShowAddPaymentSheet] = useState(false)
  const [showPaymentDetailsSheet, setShowPaymentDetailsSheet] = useState(false)
  const [selectedMethodForDetails, setSelectedMethodForDetails] = useState<string | null>(null)
  const [showAddPaymentPanel, setShowAddPaymentPanel] = useState(false)
  const { userData } = useUserDataStore()
  const userId = useUserDataStore((state) => state.userId)
  const verificationStatus = useUserDataStore((state) => state.verificationStatus)
  const onboardingStatus = useUserDataStore((state) => state.onboardingStatus)
  const isPoiExpired = process.env.NEXT_PUBLIC_IS_KYC_MANDATORY == "1" && userId && onboardingStatus?.kyc?.poi_status !== "approved"
  const isPoaExpired = process.env.NEXT_PUBLIC_IS_KYC_MANDATORY == "1" && userId && onboardingStatus?.kyc?.poa_status !== "approved"
  const { t, locale } = useTranslations()
  const [paymentMethodsCount, setPaymentMethodsCount] = useState(0)

  // Use React Query hook for adding payment methods
  const addPaymentMethod = useAddPaymentMethod()

  const helpCentreUrl = getHelpCentreUrl(locale)

  useEffect(() => {
    setSelectedTab(activeTab)
    if (isMobile) {
      if (activeTab === "counterparties") {
        setShowCounterpartiesSidebar(true)
      } else if (activeTab === "follows") {
        setShowFollowsSidebar(true)
      } else if (activeTab === "blocked") {
        setShowBlockedSidebar(true)
      }
    }
  }, [activeTab, isMobile])

  const handleTabChange = (tab: string) => {
    if (maintenanceActive && tab !== "stats") return
    const trackerId = profileTabTrackerMap[tab]
    if (trackerId) track(trackerId)
    setSelectedTab(tab)
    router.push(`/profile?tab=${tab}`)
  }

  const showClosedGroupTab = IS_CLOSED_GROUP_ENABLED

  const isVerifiedP2PUser = !!(userId && verificationStatus?.phone_verified && !isPoiExpired && !isPoaExpired)

  const tabs = [
    { id: "stats", label: t("profile.stats") },
    { id: "payment", label: t("profile.paymentMethods") },
    ...(isVerifiedP2PUser
      ? [
          { id: "follows", label: t("profile.follows") },
          ...(showClosedGroupTab
            ? [{ id: "closed-group", label: t("profile.closedGroup") }]
            : []),
          { id: "blocked", label: t("profile.blocked") },
          { id: "counterparties", label: t("profile.counterparties") },
        ]
      : []),
  ]

  const handleAddPaymentMethod = async (method: string, fields: Record<string, string>) => {
    try {
      await addPaymentMethod.mutateAsync({ method, fields })

      toast({
        description: (
          <div className="flex items-center gap-2">
            <Image src="/icons/tick.svg" alt={t("common.success")} width={24} height={24} className="text-white" />
            <span>{t("profile.paymentMethodAdded")}</span>
          </div>
        ),
        className: "bg-black text-white border-black h-[48px] rounded-lg px-[16px] py-[8px]",
        duration: 2500,
      })

      setShowAddPaymentPanel(false)
    } catch (err) {
      const error = err as PaymentMethodError
      const errorCode = error?.errors?.[0]?.code

      if (errorCode === "PaymentMethodDuplicate") {
        showAlert(
          createPaymentMethodDuplicateAlertConfig(t, {
            onManage: () => {
              hideAlert()
              setShowAddPaymentPanel(false)
            },
          }),
        )
        return
      }

      const errorMessages: Record<string, { title: string; description: string }> = {
        PaymentMethodInvalid: { title: t("paymentMethod.invalidMethod"), description: t("paymentMethod.invalidMethodDescription") },
        PaymentMethodInvalidField: { title: t("paymentMethod.invalidField"), description: t("paymentMethod.invalidFieldDescription") },
        PaymentMethodNotFound: { title: t("paymentMethod.notFound"), description: t("paymentMethod.notFoundDescription") },
        PaymentMethodRequiredField: { title: t("paymentMethod.requiredField"), description: t("paymentMethod.requiredFieldDescription") },
      }

      const { title, description } = (typeof errorCode === "string" ? errorMessages[errorCode] : undefined) ?? {
        title: t("paymentMethod.unableToAdd"),
        description: t("paymentMethod.addError"),
      }

      showAlert({
        title,
        description,
        confirmText: t("common.ok"),
        type: "warning",
      })
    }
  }

  const handleShowAddPaymentMethod = () => {
    if (userId && verificationStatus?.phone_verified && !isPoiExpired && !isPoaExpired) {
      setShowAddPaymentPanel(true)
    } else {
      showAlert(createKycOnboardingAlertConfig({ route: "profile",
        onClose: hideAlert }))
    }
  }

  return (
    <div className="relative px-3 md:px-0">
      <div className="mb-[64px] md:mb-6">
        {isMobile ? (
          <div className="mx-[-12px]">
            <div className="font-bold text-[18px] mx-6 mt-6">{t("profile.aboutYou")}</div>
            <div
              data-testid="profile-menu-stats"
              onClick={() => {
                track("ek_my_stats_profile")
                setShowStatsSidebar(true)
              }}
              className="grid grid-cols-[auto_1fr_1fr] items-center justify-between p-6 cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <Image src="/icons/profile-stats.svg" width={20} height={20} />
              <span className="text-sm font-normal text-gray-900 ms-4">{t("profile.stats")}</span>
              <Image
                src="/icons/chevron-right-gray.png"
                alt={t("common.chevronRight")}
                width={20}
                height={20}
                className={cn("justify-self-end", RTL_MIRROR_ICON)}
              />
            </div>
            {showStatsSidebar && (
              <div className="fixed inset-y-0 end-0 z-50 bg-white shadow-xl flex flex-col inset-0 w-full">
                <div className="flex items-center gap-4 px-4 py-3">
                  <Button
                    data-testid="profile-btn-sidebar-back"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowStatsSidebar(false)}
                    className="bg-grayscale-300 px-1"
                  >
                    <BackArrowIcon alt={t("common.close")} width={24} height={24} />
                  </Button>
                </div>
                <div className="m-4">
                  <h2 className="text-2xl font-bold mb-4 px-2 md:px-2">{t("profile.stats")}</h2>
                  <StatsGrid stats={stats} />
                </div>
              </div>
            )}
            <Divider className="ms-[60px]" />
            <div
              data-testid="profile-menu-payment-methods"
              onClick={() => {
                track("ek_payment_methods_profile")
                setShowPaymentMethodsSidebar(true)
              }}
              className="grid grid-cols-[auto_1fr_1fr] items-center justify-between p-6 cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <Image src="/icons/profile-pm.svg" width={20} height={20} />
              <span className="text-sm font-normal text-gray-900 ms-4">{t("profile.paymentMethods")}</span>
              <Image
                src="/icons/chevron-right-gray.png"
                alt={t("common.chevronRight")}
                width={20}
                height={20}
                className={cn("justify-self-end", RTL_MIRROR_ICON)}
              />
            </div>
            {showPaymentMethodsSidebar && (
              <div className="fixed inset-y-0 end-0 z-50 bg-white shadow-xl flex flex-col inset-0 w-full">
                <div className="flex items-center gap-4 px-4 py-3">
                  <Button
                    data-testid="profile-btn-sidebar-back"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPaymentMethodsSidebar(false)}
                    className="bg-grayscale-300 px-1"
                  >
                    <BackArrowIcon alt={t("common.close")} width={24} height={24} />
                  </Button>
                </div>
                <div className="m-4 flex-1 overflow-auto">
                  {paymentMethodsCount > 0 && (
                    <h2 className="text-2xl font-bold mb-4">{t("profile.paymentMethods")}</h2>
                  )}
                  <PaymentMethodsTab
                    onAddPaymentMethod={handleShowAddPaymentMethod}
                    onPaymentMethodsCountChange={setPaymentMethodsCount}
                  />
                </div>
                {paymentMethodsCount > 0 && (
                  <div className="p-4">
                    <Button
                      data-testid="profile-btn-add-payment"
                      onClick={handleShowAddPaymentMethod}
                      variant="outline"
                      className="w-full rounded-full bg-transparent"
                    >
                      {t("profile.addPaymentMethod")}
                    </Button>
                  </div>
                )}
              </div>
            )}
            {isVerifiedP2PUser && (
            <>
            <Divider className="ms-[60px]" />
            <div className="font-bold text-[18px] mx-6 mt-6">{t("profile.settings")}</div>
            <div
              data-testid="profile-menu-follows"
              onClick={() => {
                track("ek_following_profile")
                setShowFollowsSidebar(true)
              }}
              className="grid grid-cols-[auto_1fr_1fr] items-center justify-between p-6 cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <Image src="/icons/profile-follows.svg" width={20} height={20} />
              <span className="text-sm font-normal text-gray-900 ms-4">{t("profile.follows")}</span>
              <Image
                src="/icons/chevron-right-gray.png"
                alt={t("common.chevronRight")}
                width={20}
                height={20}
                className={cn("justify-self-end", RTL_MIRROR_ICON)}
              />
            </div>
            {showFollowsSidebar && (
              <div className="fixed inset-y-0 end-0 z-50 bg-white shadow-xl flex flex-col inset-0 w-full">
                <div className="flex items-center gap-4 px-4 py-3">
                  <Button
                    data-testid="profile-btn-sidebar-back"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowFollowsSidebar(false)}
                    className="bg-grayscale-300 px-1"
                  >
                    <BackArrowIcon alt={t("common.close")} width={24} height={24} />
                  </Button>
                </div>
                <div className="m-4 flex-1 overflow-auto">
                  <h2 className="text-2xl font-bold mb-4">{t("profile.follows")}</h2>
                  <FollowsTab />
                </div>
              </div>
            )}
            {showClosedGroupTab && (
              <>
                <Divider className="ms-[60px]" />
                <div
                  data-testid="profile-menu-closed-group"
                  onClick={() => {
                    track("ek_closed_group_profile")
                    setShowClosedGroupSidebar(true)
                  }}
                  className="grid grid-cols-[auto_1fr_1fr] items-center justify-between p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <Image src="/icons/star-light.svg" width={20} height={20} />
                  <span className="text-sm font-normal text-gray-900 ms-4">{t("profile.closedGroup")}</span>
                  <Image
                    src="/icons/chevron-right-gray.png"
                    alt={t("common.chevronRight")}
                    width={20}
                    height={20}
                    className="justify-self-end"
                  />
                </div>
              </>)}
            {showClosedGroupTab && showClosedGroupSidebar && (
              <div className="fixed inset-y-0 end-0 z-50 bg-white shadow-xl flex flex-col inset-0 w-full">
                <div className="flex items-center gap-4 px-4 py-3">
                  <Button
                    data-testid="profile-btn-sidebar-back"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowClosedGroupSidebar(false)}
                    className="bg-grayscale-300 px-1"
                  >
                    <BackArrowIcon alt={t("common.close")} width={24} height={24} />
                  </Button>
                </div>
                <div className="m-4 flex-1 overflow-auto">
                  <h2 className="text-2xl font-bold mb-4">{t("profile.closedGroup")}</h2>
                  <ClosedGroupTab />
                </div>
              </div>
            )}
            <Divider className="ms-[60px]" />
            <div
              data-testid="profile-menu-blocked"
              onClick={() => {
                track("ek_blocked_users_profile")
                setShowBlockedSidebar(true)
              }}
              className="grid grid-cols-[auto_1fr_1fr] items-center justify-between p-6 cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <Image src="/icons/profile-blocks.svg" width={20} height={20} />
              <span className="text-sm font-normal text-gray-900 ms-4">{t("profile.blocked")}</span>
              <Image
                src="/icons/chevron-right-sm.png"
                alt={t("common.chevronRight")}
                width={20}
                height={20}
                className={cn("justify-self-end", RTL_MIRROR_ICON)}
              />
            </div>
            {showBlockedSidebar && (
              <div className="fixed inset-y-0 end-0 z-50 bg-white shadow-xl flex flex-col inset-0 w-full">
                <div className="flex items-center gap-4 px-4 py-3">
                  <Button
                    data-testid="profile-btn-sidebar-back"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowBlockedSidebar(false)}
                    className="bg-grayscale-300 px-1"
                  >
                    <BackArrowIcon alt={t("common.close")} width={24} height={24} />
                  </Button>
                </div>
                <div className="m-4 flex-1 overflow-auto">
                  <h2 className="text-2xl font-bold mb-4">{t("profile.blocked")}</h2>
                  <BlockedTab />
                </div>
              </div>
            )}
            <Divider className="ms-[60px]" />
            <div
              data-testid="profile-menu-counterparties"
              onClick={() => {
                track("ek_trade_partners_profile")
                setShowCounterpartiesSidebar(true)
              }}
              className="grid grid-cols-[auto_1fr_1fr] items-center justify-between p-6 cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <Image src="/icons/counterparties.svg" width={20} height={20} />
              <span className="text-sm font-normal text-gray-900 ms-4">{t("profile.counterparties")}</span>
              <Image
                src="/icons/chevron-right-sm.png"
                alt={t("common.chevronRight")}
                width={20}
                height={20}
                className={cn("justify-self-end", RTL_MIRROR_ICON)}
              />
            </div>
            {showCounterpartiesSidebar && (
              <div className="fixed inset-y-0 end-0 z-50 bg-white shadow-xl flex flex-col inset-0 w-full">
                <div className="flex items-center gap-4 px-4 py-3">
                  <Button
                    data-testid="profile-btn-sidebar-back"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowCounterpartiesSidebar(false)}
                    className="bg-grayscale-300 px-1"
                  >
                    <BackArrowIcon alt={t("common.close")} width={24} height={24} />
                  </Button>
                </div>
                <div className="m-4 flex-1 overflow-auto">
                  <h2 className="text-2xl font-bold mb-4">{t("profile.counterparties")}</h2>
                  <CounterpartiesTab />
                </div>
              </div>
            )}
            </>
            )}
            <Divider className="ms-[60px]" />
            <div className="font-bold text-[18px] mx-6 mt-6">{t("profile.support")}</div>
            <div
              data-testid="profile-menu-help"
              onClick={() => {
                track("ek_help_centre_profile")
                window.location.href = helpCentreUrl
              }}
              className="grid grid-cols-[auto_1fr_1fr] items-center justify-between p-6 cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <Image src="/icons/profile-help-centre.svg" width={20} height={20} />
              <span className="text-sm font-normal text-gray-900 ms-4">{t("navigation.p2pHelpCentre")}</span>
              <Image
                src="/icons/chevron-right-gray.png"
                alt={t("common.chevronRight")}
                width={20}
                height={20}
                className={cn("justify-self-end", RTL_MIRROR_ICON)}
              />
            </div>
            {!userData?.feedback_exist && isVerifiedP2PUser && (
              <>
                <Divider className="ms-[60px]" />
                <div
                  data-testid="profile-menu-feedback"
                  onClick={() => setShowFeedbackDialog(true)}
                  className="grid grid-cols-[auto_1fr_1fr] items-center justify-between p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <Image src="/icons/ic-feedback.svg" width={20} height={20} alt="" />
                  <span className="text-sm font-normal text-gray-900 ms-4">{t("nps.sendFeedback")}</span>
                  <Image
                    src="/icons/chevron-right-gray.png"
                    alt={t("common.chevronRight")}
                    width={20}
                    height={20}
                    className="justify-self-end"
                  />
                </div>
              </>
            )}
          </div>
        ) : (
          <Tabs value={selectedTab} onValueChange={handleTabChange} className="h-full">
            <div className="mb-2 md:mt-8">
              <div className="overflow-x-auto">
                {/* Gray line is on TabsList (inside the overflow container) so it is never
                    clipped. Active indicator uses after:: positioned within the button
                    bounds — no negative margins that overflow-x-auto would clip. */}
                <TabsList className="h-auto min-h-10 w-auto bg-transparent p-0 gap-1 md:gap-2 border-b-2 border-b-grayscale-500">
                  {tabs.map((tab) => (
                    <TabsTrigger
                      key={tab.id}
                      value={tab.id}
                      data-testid={`profile-tab-${tab.id === "payment" ? "payment-methods" : tab.id}`}
                      className="h-auto w-auto flex-none shrink-0 px-4 md:px-5 py-2.5 rounded-none leading-normal after:content-[''] after:absolute after:inset-x-0 after:bottom-0 after:h-[2px] after:transition-colors data-[state=active]:after:bg-black data-[state=active]:!shadow-none data-[state=active]:!bg-transparent data-[state=active]:text-foreground"
                    >
                      {tab.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>
            </div>

            <TabsContent value="stats" className="mt-4">
              {isLoading ? (
                <div className="space-y-4">
                  <div className="rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="py-4">
                          <Skeleton className="bg-grayscale-500 h-4 w-3/4 mb-2 rounded" />
                          <Skeleton className="bg-grayscale-500 h-8 w-1/2 rounded" />
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-b border-slate-200 py-2">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="py-4">
                          <Skeleton className="bg-grayscale-500 h-4 w-3/4 mb-2 rounded" />
                          <Skeleton className="bg-grayscale-500 h-8 w-1/2 rounded" />
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="py-4">
                          <Skeleton className="bg-grayscale-500 h-4 w-3/4 mb-2 rounded" />
                          <Skeleton className="bg-grayscale-500 h-8 w-1/2 rounded" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <StatsGrid stats={stats} />
                </div>
              )}
            </TabsContent>

            <TabsContent value="payment" className="mt-4 h-[calc(100vh-440px)] overflow-y-auto">
              <div className="relative">
                {paymentMethodsCount > 0 && (
                  <div className="flex justify-end mb-4">
                    <Button data-testid="profile-btn-add-payment" variant="outline" size="sm" onClick={handleShowAddPaymentMethod}>
                      <Image src="/icons/plus_icon.png" alt={t("common.addPayment")} width={14} height={24} className="me-1" />
                      {t("profile.addPaymentMethod")}
                    </Button>
                  </div>
                )}
                <PaymentMethodsTab
                  onAddPaymentMethod={handleShowAddPaymentMethod}
                  onPaymentMethodsCountChange={setPaymentMethodsCount}
                />
              </div>
            </TabsContent>

            <TabsContent value="counterparties" className="mt-4 h-[calc(100vh-480px)]">
              <div className="relative h-full">
                <CounterpartiesTab />
              </div>
            </TabsContent>

            <TabsContent value="follows" className="mt-4 h-[calc(100vh-480px)]">
              <div className="relative h-full">
                <FollowsTab />
              </div>
            </TabsContent>

            {showClosedGroupTab && (
              <TabsContent value="closed-group" className="mt-4 h-[calc(100vh-440px)] overflow-y-auto">
                <div className="relative">
                  <ClosedGroupTab />
                </div>
              </TabsContent>
            )}

            <TabsContent value="blocked" className="mt-4 h-[calc(100vh-440px)]">
              <div className="relative h-full">
                <BlockedTab />
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>

      {showAddPaymentPanel && (
        <AddPaymentMethodPanel
          onAdd={handleAddPaymentMethod}
          isLoading={addPaymentMethod.isPending}
          onClose={() => setShowAddPaymentPanel(false)}
        />
      )}
      <FeedbackDialog isOpen={showFeedbackDialog} onClose={() => setShowFeedbackDialog(false)} />
    </div>
  )
}
