/**
 * True only when running `next dev`.
 *
 * Local dev cannot talk to the Deriv upstreams directly: the Core API rejects
 * CORS preflights from `localhost` with a 403, Ory omits
 * `access-control-allow-origin`, and Ory's cookies are scoped to
 * `Domain=deriv.com`. Dev therefore routes browser traffic through the
 * same-origin BFF proxies under `app/api/`.
 *
 * Next inlines `process.env.NODE_ENV` at build time, so in any built artifact
 * this folds to `false` and the proxy branches are dead-code eliminated —
 * deployed behaviour is unchanged.
 *
 * Checked positively against "development" rather than negatively against
 * "production" on purpose: the staging workflow builds with
 * `NODE_ENV: staging`, where only the positive form is correct.
 *
 * Used by the server-side proxy routes. `lib/get-core-url.ts` and
 * `lib/get-ory-url.ts` deliberately inline the same comparison instead of
 * calling this: those run in the browser bundle, and only an inline
 * `process.env.NODE_ENV` check gets const-folded away — a cross-module call
 * would leave the dead branch, and the dev-only proxy paths, in the shipped
 * client JS. Keep the three in sync.
 */
export function isLocalDev(): boolean {
  return process.env.NODE_ENV === "development"
}
