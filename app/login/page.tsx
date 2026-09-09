import { notFound } from "next/navigation"

import { LoginForm } from "./login-form"
import { isLocalDev } from "@/lib/is-local-dev"

export const runtime = "edge"

/**
 * Local-dev only login route.
 *
 * Deployed environments authenticate through home.deriv.com, which redirects
 * back with a `?token=` param — there is no form to render there, so this route
 * 404s outside `next dev`.
 *
 * The guard lives in this server component rather than inside `LoginForm` so the
 * form never renders and none of its client JS is reachable in a deployed build.
 *
 * Caveat: a deployed build serves the "Page not found" body with a **200**
 * status, not 404. The root layout is edge-rendered, calls `cookies()`, and wraps
 * `children` in `<Suspense>`, so the response is committed before this component
 * runs — `notFound()` can swap the body but not the status. That affects every
 * rendered-then-notFound route in this app, not just this one. Making it a true
 * 404 would need `middleware.ts` or a root-layout change, both of which touch the
 * Cloudflare deploy artifact.
 */
export default function LoginPage() {
  if (!isLocalDev()) {
    notFound()
  }

  return <LoginForm />
}
