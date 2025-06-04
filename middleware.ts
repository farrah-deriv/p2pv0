import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const publicPaths = ["/login", "/signup", "/forgot-password"]
const authPaths = ["/login", "/signup", "/forgot-password"]

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
    isAuthorized = JSON.parse(localStorage.getItem("auth_token") ?? "");
  }

  const authToken =
    request.cookies.get("auth_token")?.value ||
    request.headers.get("authorization")?.split(" ")[1] ||
    isAuthorized



  const isAuthenticated = !!authToken

  if (isAuthenticated && authPaths.some((path) => pathname.startsWith(path))) {
    return NextResponse.redirect(new URL("/", request.url))
  }

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