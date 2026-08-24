import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

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

  // Better Auth prefixes the cookie with __Secure- on HTTPS and in production.
  // Matching a hardcoded name works on http://localhost and nowhere else, so
  // this helper — which knows the prefix and both separator forms — is the
  // only safe way to ask the question.
  const hasSessionCookie = getSessionCookie(request) !== null;

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
