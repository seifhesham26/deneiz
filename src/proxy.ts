import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/constants";

/**
 * Network-level gate for /admin/*. There is a single login surface (/account);
 * anonymous admin traffic is bounced there with a next hint. Role checks run
 * again on every admin tRPC procedure — the proxy only stops anonymous traffic.
 */
export function proxy(request: NextRequest) {
  // The dedicated admin login was merged into /account — keep old links working
  if (request.nextUrl.pathname === "/admin/login") {
    return NextResponse.redirect(new URL("/account", request.url));
  }

  const hasSessionCookie = request.cookies.has(SESSION_COOKIE_NAME);

  if (!hasSessionCookie) {
    const accountUrl = new URL("/account", request.url);
    accountUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(accountUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
