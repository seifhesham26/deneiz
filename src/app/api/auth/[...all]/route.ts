import { getAuth } from "@/lib/better-auth";

/**
 * Better Auth's fetch handler covers every auth route (sign-in/up/out,
 * session…). Delegation stays lazy so importing this route during a build
 * never demands credentials.
 */
async function delegateAuthRequest(request: Request): Promise<Response> {
  return getAuth().handler(request);
}

export { delegateAuthRequest as GET, delegateAuthRequest as POST };
