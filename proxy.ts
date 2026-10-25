import { NextResponse, type NextRequest } from "next/server";
import { checkAdminAuth } from "@/lib/admin-auth";

// Gates /admin with HTTP Basic Auth. Deliberately not a login page/session/DB
// — this is a single-operator read-only orders view, and Basic Auth over TLS
// is the native platform mechanism for exactly that, at zero dependencies.
// The admin page re-checks with the same helper; this is only the first gate.
export function proxy(request: NextRequest) {
  const result = checkAdminAuth(request.headers);
  if (result.ok) return NextResponse.next();

  if (result.status === 503) return new NextResponse("Admin not configured.", { status: 503 });
  if (result.status === 429) {
    return new NextResponse("Too many attempts.", {
      status: 429,
      headers: { "Retry-After": String(result.retryAfter) },
    });
  }
  return new NextResponse("Authentication required.", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Admin"' },
  });
}

export const config = {
  matcher: "/admin/:path*",
};
