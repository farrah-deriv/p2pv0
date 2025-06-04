import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const publicPaths = ["/login", "/signup", "/forgot-password"]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  let isAuthorized = false

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/static")
  ) {
    return NextResponse.next()
  }


  if (typeof window !== 'undefined') {
    isAuthorized = localStorage.getItem("auth_token") ? true : false;
  }

  if (isAuthorized) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  if (!isAuthorized && !publicPaths.some((path) => pathname.startsWith(path))) {
    const redirectUrl = new URL("/login", request.url)
    redirectUrl.searchParams.set("redirect", pathname)
    return NextResponse.redirect(redirectUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}