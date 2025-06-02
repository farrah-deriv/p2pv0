import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// List of paths that don't require authentication
const publicPaths = ["/login", "/signup", "/forgot-password"]

// List of paths that should redirect to home if already authenticated
const authPaths = ["/login", "/signup", "/forgot-password"]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  let isAuthorized = false

  // Skip middleware for static files, images, and API routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/static")
  ) {
    return NextResponse.next()
  }


  if (typeof window !== 'undefined') {
    isAuthorized = JSON.parse(localStorage.getItem("auth_token") ?? "");
  }
  // Check if user is authenticated
  const authToken =
    request.cookies.get("auth_token")?.value ||
    request.headers.get("authorization")?.split(" ")[1] ||
    isAuthorized



  const isAuthenticated = !!authToken

  // If user is on an auth page and is already authenticated, redirect to home
  if (isAuthenticated && authPaths.some((path) => pathname.startsWith(path))) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  // If user is not authenticated and not on a public path, redirect to login
  if (!isAuthenticated && !publicPaths.some((path) => pathname.startsWith(path))) {
    const redirectUrl = new URL("/login", request.url)
    redirectUrl.searchParams.set("redirect", pathname)
    return NextResponse.redirect(redirectUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
