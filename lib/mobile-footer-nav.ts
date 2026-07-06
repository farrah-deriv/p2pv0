export function shouldShowMobileFooterNav(
  pathname: string,
  isChatVisible: boolean,
  isTransactionListVisible: boolean,
): boolean {
  if (pathname.startsWith("/orders/")) return false
  if (pathname.startsWith("/ads/create")) return false
  if (pathname.startsWith("/ads/edit")) return false
  if (isChatVisible) return false
  if (pathname.startsWith("/wallet") && isTransactionListVisible) return false
  return true
}
