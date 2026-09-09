// Novu renders `notification.avatar` into a real <img src=...>. Those URLs
// come from the notification payload (often third-party hosts not in img-src)
// and CSP blocks them. Returning null short-circuits the <img> entirely —
// same approach as home-app's `renderNovuInboxAvatarNull`.
export function renderNovuAvatarNull() {
  return null
}
