import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = "muted_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 180; // 180 days

/**
 * Issues an opaque, server-generated workspace/session id as an httpOnly
 * cookie. The client never chooses or sends this value in a request body —
 * every /api/* route and Server Component reads it only from this cookie,
 * so a judge cannot address (or spoof) another judge's workspace.
 */
export function proxy(request: NextRequest) {
  const existing = request.cookies.get(SESSION_COOKIE)?.value;
  if (existing) {
    return NextResponse.next();
  }

  const sessionId = crypto.randomUUID();

  // Forward the new cookie on the request itself so Server Components
  // rendered later in this same pass can already read it via cookies().
  const forwardedHeaders = new Headers(request.headers);
  const existingCookieHeader = forwardedHeaders.get("cookie");
  forwardedHeaders.set(
    "cookie",
    existingCookieHeader
      ? `${existingCookieHeader}; ${SESSION_COOKIE}=${sessionId}`
      : `${SESSION_COOKIE}=${sessionId}`
  );

  const response = NextResponse.next({ request: { headers: forwardedHeaders } });
  response.cookies.set(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_MAX_AGE_SECONDS,
    path: "/",
  });
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
