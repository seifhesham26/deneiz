import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/constants";

/**
 * Network-level gate for /admin/*. A full session validation (and role check)
 * runs server-side on every admin tRPC procedure — this proxy only stops
 * anonymous traffic before it reaches the app.
 */
export function proxy(request: NextRequest) {
  // The login page must stay reachable without a session
  if (request.nextUrl.pathname === "/admin/login") {
    return NextResponse.next();
  }

  const hasSessionCookie = request.cookies.has(SESSION_COOKIE_NAME);

  if (!hasSessionCookie) {
    const loginUrl = new URL("/admin/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
